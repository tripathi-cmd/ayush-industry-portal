import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pool, query, initDb } from './db.js';
import { seedAssessments, bootstrapAdmin } from './seed.js';
import { calculateMatchScore, generateSkillGapAdvice, SKILL_TAXONOMY } from './services/skillMatcher.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required.');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

// ─── Middleware ───
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ─── Auth helpers ───
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function setSessionCookie(res, token) {
  res.cookie('sc_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_MS,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie('sc_session', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
}

/** Creates a session row and returns a signed JWT */
async function createSession(userId) {
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);
  await query(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)',
    [sessionId, userId, expiresAt]
  );
  return jwt.sign({ sid: sessionId }, JWT_SECRET, { expiresIn: '7d' });
}

/** Authenticate middleware – reads HttpOnly cookie, validates session from DB */
const authenticate = async (req, res, next) => {
  const token = req.cookies?.sc_session;
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  try {
    const { sid } = jwt.verify(token, JWT_SECRET);
    const { rows } = await query(
      'SELECT s.id, s.user_id, s.expires_at, s.revoked, u.role, u.approval FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = $1',
      [sid]
    );
    if (rows.length === 0 || rows[0].revoked || new Date(rows[0].expires_at) < new Date()) {
      clearSessionCookie(res);
      return res.status(401).json({ message: 'Session expired or invalid' });
    }
    req.user = { id: rows[0].user_id, role: rows[0].role, approval: rows[0].approval, sessionId: sid };
    next();
  } catch {
    clearSessionCookie(res);
    return res.status(401).json({ message: 'Invalid session token' });
  }
};

/** Optional auth – identifies user if cookie present */
const optionalAuth = async (req, res, next) => {
  const token = req.cookies?.sc_session;
  if (token) {
    try {
      const { sid } = jwt.verify(token, JWT_SECRET);
      const { rows } = await query(
        'SELECT s.user_id, u.role, u.approval FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = $1 AND s.revoked = false AND s.expires_at > now()',
        [sid]
      );
      if (rows.length > 0) {
        req.user = { id: rows[0].user_id, role: rows[0].role, approval: rows[0].approval };
      }
    } catch { /* ignore */ }
  }
  next();
};

/** Role guard */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
}

/** Strip fields from user row for client */
function sanitiseUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return rest;
}

// ═══════════════════════════════════════════════════════════════
//  HEALTH CHECK
// ═══════════════════════════════════════════════════════════════
app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'healthy', portal: 'Skill Connect API', version: '2.0.0', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', db: 'disconnected', error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  TAXONOMY
// ═══════════════════════════════════════════════════════════════
app.get('/api/taxonomy', (_req, res) => {
  res.json(SKILL_TAXONOMY);
});

// ═══════════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════════
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role, name, institution, degree, companyName, expertise } = req.body;

    if (!email || !password || !role || !name) {
      return res.status(400).json({ message: 'Email, password, role, and name are required' });
    }
    if (!['student', 'recruiter', 'mentor'].includes(role)) {
      return res.status(400).json({ message: 'Registration is available for student, recruiter, or mentor roles' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const id = `usr_${uuidv4().split('-')[0]}`;

    const approval = role === 'student' ? 'approved' : 'pending';
    const profile = {};

    if (role === 'student') {
      profile.institution = institution || '';
      profile.degree = degree || '';
      profile.skills = [];
      profile.bio = '';
      profile.phone = '';
      profile.location = '';
    } else if (role === 'recruiter') {
      profile.companyName = companyName || '';
      profile.industry = '';
      profile.website = '';
      profile.about = '';
      profile.phone = '';
      profile.location = '';
    } else if (role === 'mentor') {
      profile.expertise = expertise || '';
      profile.bio = '';
      profile.phone = '';
      profile.location = '';
    }

    await query(
      'INSERT INTO users (id, email, password_hash, role, name, approval, profile) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, email.toLowerCase(), hash, role, name, approval, JSON.stringify(profile)]
    );

    const token = await createSession(id);
    setSessionCookie(res, token);

    res.status(201).json({
      user: { id, email: email.toLowerCase(), role, name, approval, profile },
      message: role === 'student'
        ? 'Registration successful! Welcome to Skill Connect.'
        : 'Registration successful! Your account is pending admin approval.'
    });
  } catch (err) {
    if (err.code === '23505' && err.constraint?.includes('email')) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const user = rows[0];
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = await createSession(user.id);
    setSessionCookie(res, token);

    res.json({ user: sanitiseUser(user), message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});

app.post('/api/auth/logout', authenticate, async (req, res) => {
  await query('UPDATE sessions SET revoked = true WHERE id = $1', [req.user.sessionId]);
  clearSessionCookie(res);
  res.json({ message: 'Logged out' });
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
  res.json(sanitiseUser(rows[0]));
});

// ═══════════════════════════════════════════════════════════════
//  STUDENT ROUTES
// ═══════════════════════════════════════════════════════════════
app.put('/api/students/profile', authenticate, requireRole('student'), async (req, res) => {
  const allowedKeys = ['name', 'bio', 'phone', 'location', 'institution', 'degree', 'skills'];
  const updates = {};
  for (const k of allowedKeys) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }

  const { rows } = await query('SELECT profile FROM users WHERE id = $1', [req.user.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

  const profile = { ...rows[0].profile };
  const nameUpdate = updates.name;
  delete updates.name;

  // Merge profile fields
  for (const [k, v] of Object.entries(updates)) {
    profile[k] = v;
  }

  if (nameUpdate) {
    await query('UPDATE users SET name = $1, profile = $2 WHERE id = $3', [nameUpdate, JSON.stringify(profile), req.user.id]);
  } else {
    await query('UPDATE users SET profile = $1 WHERE id = $2', [JSON.stringify(profile), req.user.id]);
  }

  const { rows: updated } = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  res.json({ user: sanitiseUser(updated[0]), message: 'Profile updated' });
});

app.get('/api/students/recommendations', authenticate, requireRole('student'), async (req, res) => {
  const { rows: userRows } = await query('SELECT profile FROM users WHERE id = $1', [req.user.id]);
  if (userRows.length === 0) return res.status(404).json({ message: 'User not found' });

  const studentSkills = userRows[0].profile?.skills || [];
  const { rows: opps } = await query("SELECT * FROM opportunities WHERE status = 'approved' ORDER BY created_at DESC");

  const recommendations = opps.map(opp => {
    const analysis = calculateMatchScore(studentSkills, opp.required_skills || []);
    return {
      ...opp,
      matchScore: analysis.matchScore,
      matchingSkills: analysis.matchingSkills,
      missingSkills: analysis.missingSkills,
      skillGapAdvice: generateSkillGapAdvice(analysis.missingSkills),
    };
  });

  recommendations.sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));
  res.json(recommendations);
});

// ═══════════════════════════════════════════════════════════════
//  ASSESSMENTS
// ═══════════════════════════════════════════════════════════════
app.get('/api/assessments', async (_req, res) => {
  const { rows } = await query('SELECT id, category, title, description, duration_minutes, passing_score, jsonb_array_length(questions) AS question_count FROM assessments ORDER BY category, title');
  res.json(rows);
});

app.get('/api/assessments/:id', async (req, res) => {
  const { rows } = await query('SELECT * FROM assessments WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Assessment not found' });

  const asm = rows[0];
  // Strip answer keys before sending
  const questions = (asm.questions || []).map(q => ({
    id: q.id,
    question: q.question,
    options: q.options,
  }));

  res.json({
    id: asm.id,
    category: asm.category,
    title: asm.title,
    description: asm.description,
    duration_minutes: asm.duration_minutes,
    passing_score: asm.passing_score,
    questions,
  });
});

app.post('/api/assessments/:id/submit', authenticate, requireRole('student'), async (req, res) => {
  const { answers } = req.body;
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ message: 'Answers object is required' });
  }

  const { rows } = await query('SELECT * FROM assessments WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Assessment not found' });

  const asm = rows[0];
  let correctCount = 0;
  const review = [];

  for (const q of asm.questions) {
    const userAnswer = answers[q.id];
    const isCorrect = userAnswer === q.correctAnswer;
    if (isCorrect) correctCount++;
    review.push({
      id: q.id,
      question: q.question,
      userAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect,
      rationale: q.rationale,
    });
  }

  const score = Math.round((correctCount / asm.questions.length) * 100);
  const passed = score >= asm.passing_score;

  const attemptId = `att_${uuidv4().split('-')[0]}`;

  // Upsert – replace previous attempt
  await query(
    `INSERT INTO assessment_attempts (id, user_id, assessment_id, answers, score, passed)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, assessment_id) DO UPDATE SET answers = $4, score = $5, passed = $6, completed_at = now()`,
    [attemptId, req.user.id, asm.id, JSON.stringify(answers), score, passed]
  );

  res.json({ score, passed, correctCount, totalQuestions: asm.questions.length, review });
});

// Student's attempt history
app.get('/api/assessments/attempts/me', authenticate, requireRole('student'), async (req, res) => {
  const { rows } = await query(
    `SELECT aa.*, a.title, a.category FROM assessment_attempts aa
     JOIN assessments a ON a.id = aa.assessment_id
     WHERE aa.user_id = $1 ORDER BY aa.completed_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

// ═══════════════════════════════════════════════════════════════
//  OPPORTUNITIES
// ═══════════════════════════════════════════════════════════════
app.get('/api/opportunities', optionalAuth, async (req, res) => {
  const { type, search } = req.query;
  let sql = 'SELECT * FROM opportunities';
  const conditions = [];
  const params = [];

  // Only show approved to non-admin, non-recruiter-owner
  if (!req.user || req.user.role === 'student' || req.user.role === 'mentor') {
    conditions.push("status = 'approved'");
  } else if (req.user.role === 'recruiter') {
    conditions.push("(status = 'approved' OR posted_by = $" + (params.length + 1) + ")");
    params.push(req.user.id);
  }
  // Admin sees all

  if (type && type !== 'all') {
    params.push(`%${type}%`);
    conditions.push(`type ILIKE $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    const p = params.length;
    conditions.push(`(title ILIKE $${p} OR company_name ILIKE $${p} OR location ILIKE $${p} OR description ILIKE $${p})`);
  }

  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY created_at DESC';

  const { rows } = await query(sql, params);

  // Attach match scores for logged-in students
  if (req.user?.role === 'student') {
    const { rows: userRows } = await query('SELECT profile FROM users WHERE id = $1', [req.user.id]);
    const studentSkills = userRows[0]?.profile?.skills || [];
    for (const opp of rows) {
      const analysis = calculateMatchScore(studentSkills, opp.required_skills || []);
      opp.matchScore = analysis.matchScore;
      opp.matchingSkills = analysis.matchingSkills;
      opp.missingSkills = analysis.missingSkills;
    }
  }

  res.json(rows);
});

app.get('/api/opportunities/:id', optionalAuth, async (req, res) => {
  const { rows } = await query('SELECT * FROM opportunities WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Opportunity not found' });

  const opp = rows[0];

  // Access check – pending/rejected visible only to owner or admin
  if (opp.status !== 'approved') {
    if (!req.user || (req.user.role !== 'admin' && req.user.id !== opp.posted_by)) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }
  }

  if (req.user?.role === 'student') {
    const { rows: userRows } = await query('SELECT profile FROM users WHERE id = $1', [req.user.id]);
    const skills = userRows[0]?.profile?.skills || [];
    const analysis = calculateMatchScore(skills, opp.required_skills || []);
    opp.matchScore = analysis.matchScore;
    opp.matchingSkills = analysis.matchingSkills;
    opp.missingSkills = analysis.missingSkills;
  }

  res.json(opp);
});

app.post('/api/opportunities', authenticate, requireRole('recruiter', 'admin'), async (req, res) => {
  // Check recruiter approval
  if (req.user.role === 'recruiter' && req.user.approval !== 'approved') {
    return res.status(403).json({ message: 'Your account is pending approval. You cannot post opportunities yet.' });
  }

  const { title, type, location, stipend, duration, openings, requiredSkills, description, eligibility } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });

  const { rows: userRows } = await query('SELECT name, profile FROM users WHERE id = $1', [req.user.id]);
  const companyName = userRows[0]?.profile?.companyName || userRows[0]?.name || '';

  const id = `opp_${uuidv4().split('-')[0]}`;
  const skills = Array.isArray(requiredSkills) ? requiredSkills : (requiredSkills ? requiredSkills.split(',').map(s => s.trim()).filter(Boolean) : []);
  const status = req.user.role === 'admin' ? 'approved' : 'pending';

  await query(
    `INSERT INTO opportunities (id, posted_by, company_name, title, type, location, stipend, duration, openings, status, required_skills, description, eligibility)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [id, req.user.id, companyName, title, type || 'Internship', location || 'Remote', stipend || 'Unpaid', duration || '3 Months', parseInt(openings) || 1, status, JSON.stringify(skills), description || '', eligibility || '']
  );

  const { rows: created } = await query('SELECT * FROM opportunities WHERE id = $1', [id]);
  res.status(201).json({
    opportunity: created[0],
    message: status === 'approved' ? 'Opportunity published' : 'Opportunity submitted for admin review'
  });
});

// ═══════════════════════════════════════════════════════════════
//  APPLICATIONS
// ═══════════════════════════════════════════════════════════════
app.get('/api/applications', authenticate, async (req, res) => {
  let rows;
  if (req.user.role === 'student') {
    ({ rows } = await query(
      `SELECT a.*, o.title AS opportunity_title, o.company_name, o.type AS opportunity_type, o.location AS opportunity_location
       FROM applications a JOIN opportunities o ON o.id = a.opportunity_id
       WHERE a.student_id = $1 ORDER BY a.created_at DESC`,
      [req.user.id]
    ));
  } else if (req.user.role === 'recruiter') {
    ({ rows } = await query(
      `SELECT a.*, o.title AS opportunity_title, o.company_name, u.name AS student_name, u.email AS student_email, u.profile AS student_profile
       FROM applications a
       JOIN opportunities o ON o.id = a.opportunity_id
       JOIN users u ON u.id = a.student_id
       WHERE o.posted_by = $1 ORDER BY a.created_at DESC`,
      [req.user.id]
    ));
    // Strip password from student profile
    rows = rows.map(r => { if (r.student_profile) delete r.student_profile.password_hash; return r; });
  } else if (req.user.role === 'admin') {
    ({ rows } = await query(
      `SELECT a.*, o.title AS opportunity_title, o.company_name, u.name AS student_name, u.email AS student_email
       FROM applications a JOIN opportunities o ON o.id = a.opportunity_id JOIN users u ON u.id = a.student_id
       ORDER BY a.created_at DESC`
    ));
  } else {
    rows = [];
  }
  res.json(rows);
});

app.post('/api/applications', authenticate, requireRole('student'), async (req, res) => {
  const { opportunityId } = req.body;
  if (!opportunityId) return res.status(400).json({ message: 'opportunityId is required' });

  // Check opportunity exists and is approved
  const { rows: oppRows } = await query("SELECT * FROM opportunities WHERE id = $1 AND status = 'approved'", [opportunityId]);
  if (oppRows.length === 0) return res.status(404).json({ message: 'Opportunity not found or not available' });

  // Get student skills
  const { rows: userRows } = await query('SELECT name, email, profile FROM users WHERE id = $1', [req.user.id]);
  const student = userRows[0];
  const opp = oppRows[0];

  const analysis = calculateMatchScore(student.profile?.skills || [], opp.required_skills || []);
  const id = `app_${uuidv4().split('-')[0]}`;

  try {
    await query(
      `INSERT INTO applications (id, student_id, opportunity_id, status, match_snapshot)
       VALUES ($1, $2, $3, 'applied', $4)`,
      [id, req.user.id, opportunityId, JSON.stringify({
        matchScore: analysis.matchScore,
        matchingSkills: analysis.matchingSkills,
        missingSkills: analysis.missingSkills,
        studentName: student.name,
        studentEmail: student.email,
        studentDegree: student.profile?.degree || '',
      })]
    );

    // Notification
    const notifId = `notif_${uuidv4().split('-')[0]}`;
    await query(
      `INSERT INTO notifications (id, user_id, title, message, ref_type, ref_id)
       VALUES ($1, $2, $3, $4, 'application', $5)`,
      [notifId, req.user.id, 'Application Submitted', `Your application for "${opp.title}" at ${opp.company_name} was submitted.`, id]
    );

    const { rows: created } = await query(
      `SELECT a.*, o.title AS opportunity_title, o.company_name FROM applications a JOIN opportunities o ON o.id = a.opportunity_id WHERE a.id = $1`,
      [id]
    );
    res.status(201).json({ application: created[0], message: 'Application submitted' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'You have already applied for this opportunity' });
    throw err;
  }
});

app.patch('/api/applications/:id/status', authenticate, requireRole('recruiter', 'admin'), async (req, res) => {
  const { status, interviewDetails } = req.body;
  const validStatuses = ['applied', 'under_review', 'shortlisted', 'interview_scheduled', 'offered', 'accepted', 'rejected'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
  }

  // Check ownership for recruiter
  const { rows: appRows } = await query(
    `SELECT a.*, o.posted_by, o.title AS opp_title, o.company_name FROM applications a JOIN opportunities o ON o.id = a.opportunity_id WHERE a.id = $1`,
    [req.params.id]
  );
  if (appRows.length === 0) return res.status(404).json({ message: 'Application not found' });

  const application = appRows[0];
  if (req.user.role === 'recruiter' && application.posted_by !== req.user.id) {
    return res.status(403).json({ message: 'You can only update applications for your own postings' });
  }

  const updates = [];
  const params = [];
  if (status) {
    params.push(status);
    updates.push(`status = $${params.length}`);
  }
  if (interviewDetails) {
    params.push(JSON.stringify(interviewDetails));
    updates.push(`interview_details = $${params.length}`);
  }

  if (updates.length > 0) {
    params.push(req.params.id);
    await query(`UPDATE applications SET ${updates.join(', ')} WHERE id = $${params.length}`, params);
  }

  // Notification to student
  let msg = `Your application for "${application.opp_title}" has been updated to: ${status || application.status}.`;
  if (status === 'interview_scheduled' && interviewDetails) {
    msg = `Interview scheduled for "${application.opp_title}" with ${application.company_name}.`;
  } else if (status === 'offered') {
    msg = `Congratulations! You have been selected for "${application.opp_title}" at ${application.company_name}!`;
  }

  const notifId = `notif_${uuidv4().split('-')[0]}`;
  await query(
    `INSERT INTO notifications (id, user_id, title, message, ref_type, ref_id)
     VALUES ($1, $2, $3, $4, 'application', $5)`,
    [notifId, application.student_id, `Application Update: ${(status || application.status).replace(/_/g, ' ')}`, msg, req.params.id]
  );

  const { rows: updated } = await query('SELECT * FROM applications WHERE id = $1', [req.params.id]);
  res.json({ application: updated[0], message: 'Application updated' });
});

// ═══════════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ═══════════════════════════════════════════════════════════════
app.get('/api/admin/overview', authenticate, requireRole('admin'), async (req, res) => {
  const [students, recruiters, mentors, pendingUsers, approvedOpps, pendingOpps, totalApps, placements] = await Promise.all([
    query("SELECT COUNT(*)::int AS cnt FROM users WHERE role = 'student'"),
    query("SELECT COUNT(*)::int AS cnt FROM users WHERE role = 'recruiter'"),
    query("SELECT COUNT(*)::int AS cnt FROM users WHERE role = 'mentor'"),
    query("SELECT COUNT(*)::int AS cnt FROM users WHERE role IN ('recruiter','mentor') AND approval = 'pending'"),
    query("SELECT COUNT(*)::int AS cnt FROM opportunities WHERE status = 'approved'"),
    query("SELECT COUNT(*)::int AS cnt FROM opportunities WHERE status = 'pending'"),
    query("SELECT COUNT(*)::int AS cnt FROM applications"),
    query("SELECT COUNT(*)::int AS cnt FROM applications WHERE status IN ('offered','accepted')"),
  ]);

  res.json({
    metrics: {
      totalStudents: students.rows[0].cnt,
      totalRecruiters: recruiters.rows[0].cnt,
      totalMentors: mentors.rows[0].cnt,
      pendingApprovals: pendingUsers.rows[0].cnt,
      activeOpportunities: approvedOpps.rows[0].cnt,
      pendingOpportunities: pendingOpps.rows[0].cnt,
      totalApplications: totalApps.rows[0].cnt,
      successfulPlacements: placements.rows[0].cnt,
    }
  });
});

app.get('/api/admin/pending', authenticate, requireRole('admin'), async (req, res) => {
  const { rows: pendingUsers } = await query(
    "SELECT id, email, role, name, approval, profile, created_at FROM users WHERE approval = 'pending' ORDER BY created_at DESC"
  );
  const { rows: pendingOpps } = await query(
    "SELECT * FROM opportunities WHERE status = 'pending' ORDER BY created_at DESC"
  );
  res.json({ pendingUsers, pendingOpportunities: pendingOpps });
});

app.get('/api/admin/users', authenticate, requireRole('admin'), async (req, res) => {
  const { role } = req.query;
  let sql = "SELECT id, email, role, name, approval, profile, created_at FROM users WHERE role != 'admin'";
  const params = [];
  if (role) {
    params.push(role);
    sql += ` AND role = $1`;
  }
  sql += ' ORDER BY created_at DESC';
  const { rows } = await query(sql, params);
  res.json(rows);
});

app.patch('/api/admin/users/:id/approval', authenticate, requireRole('admin'), async (req, res) => {
  const { approval } = req.body;
  if (!['approved', 'rejected'].includes(approval)) {
    return res.status(400).json({ message: 'Approval must be "approved" or "rejected"' });
  }

  const { rows } = await query('SELECT id, role FROM users WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
  if (!['recruiter', 'mentor'].includes(rows[0].role)) {
    return res.status(400).json({ message: 'Only recruiter and mentor accounts can be approved/rejected' });
  }

  await query('UPDATE users SET approval = $1 WHERE id = $2', [approval, req.params.id]);

  // Notify the user
  const notifId = `notif_${uuidv4().split('-')[0]}`;
  await query(
    `INSERT INTO notifications (id, user_id, title, message, ref_type, ref_id) VALUES ($1, $2, $3, $4, 'approval', $5)`,
    [notifId, req.params.id, `Account ${approval}`, `Your account has been ${approval} by an administrator.`, req.params.id]
  );

  res.json({ message: `User ${approval}` });
});

app.patch('/api/admin/opportunities/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be "approved" or "rejected"' });
  }

  const { rows } = await query('SELECT * FROM opportunities WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Opportunity not found' });

  await query('UPDATE opportunities SET status = $1 WHERE id = $2', [status, req.params.id]);

  // Notify poster
  const notifId = `notif_${uuidv4().split('-')[0]}`;
  await query(
    `INSERT INTO notifications (id, user_id, title, message, ref_type, ref_id) VALUES ($1, $2, $3, $4, 'opportunity', $5)`,
    [notifId, rows[0].posted_by, `Opportunity ${status}`, `Your opportunity "${rows[0].title}" has been ${status}.`, req.params.id]
  );

  res.json({ message: `Opportunity ${status}` });
});

// ═══════════════════════════════════════════════════════════════
//  MENTORSHIP (Admin assigns, Mentor/Student interact)
// ═══════════════════════════════════════════════════════════════
app.post('/api/admin/mentorship/assign', authenticate, requireRole('admin'), async (req, res) => {
  const { mentorId, studentId } = req.body;
  if (!mentorId || !studentId) return res.status(400).json({ message: 'mentorId and studentId are required' });

  // Validate both exist and have correct roles
  const { rows: mentorRows } = await query("SELECT id FROM users WHERE id = $1 AND role = 'mentor' AND approval = 'approved'", [mentorId]);
  if (mentorRows.length === 0) return res.status(404).json({ message: 'Approved mentor not found' });

  const { rows: studentRows } = await query("SELECT id FROM users WHERE id = $1 AND role = 'student'", [studentId]);
  if (studentRows.length === 0) return res.status(404).json({ message: 'Student not found' });

  const id = `ma_${uuidv4().split('-')[0]}`;
  try {
    await query('INSERT INTO mentorship_assignments (id, mentor_id, student_id) VALUES ($1, $2, $3)', [id, mentorId, studentId]);

    // Notify both
    const n1 = `notif_${uuidv4().split('-')[0]}`;
    const n2 = `notif_${uuidv4().split('-')[0]}`;
    await query(
      `INSERT INTO notifications (id, user_id, title, message, ref_type, ref_id) VALUES ($1, $2, 'Mentorship Assigned', 'You have been assigned a new student.', 'mentorship', $3)`,
      [n1, mentorId, id]
    );
    await query(
      `INSERT INTO notifications (id, user_id, title, message, ref_type, ref_id) VALUES ($1, $2, 'Mentor Assigned', 'You have been assigned a mentor. Check your dashboard for details.', 'mentorship', $3)`,
      [n2, studentId, id]
    );

    res.status(201).json({ id, message: 'Mentorship assigned' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'This mentor-student pair is already assigned' });
    throw err;
  }
});

app.get('/api/admin/mentorship', authenticate, requireRole('admin'), async (req, res) => {
  const { rows } = await query(
    `SELECT ma.id, ma.created_at,
            m.id AS mentor_id, m.name AS mentor_name, m.email AS mentor_email,
            s.id AS student_id, s.name AS student_name, s.email AS student_email
     FROM mentorship_assignments ma
     JOIN users m ON m.id = ma.mentor_id
     JOIN users s ON s.id = ma.student_id
     ORDER BY ma.created_at DESC`
  );
  res.json(rows);
});

// Mentor sees assigned students
app.get('/api/mentor/students', authenticate, requireRole('mentor'), async (req, res) => {
  if (req.user.approval !== 'approved') return res.status(403).json({ message: 'Your account is pending approval' });

  const { rows } = await query(
    `SELECT ma.id AS assignment_id, u.id AS student_id, u.name, u.email, u.profile, ma.created_at
     FROM mentorship_assignments ma JOIN users u ON u.id = ma.student_id
     WHERE ma.mentor_id = $1 ORDER BY ma.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

// Mentor feedback
app.post('/api/mentor/feedback', authenticate, requireRole('mentor'), async (req, res) => {
  const { assignmentId, feedback } = req.body;
  if (!assignmentId || !feedback) return res.status(400).json({ message: 'assignmentId and feedback are required' });

  // Verify assignment belongs to this mentor
  const { rows: maRows } = await query('SELECT * FROM mentorship_assignments WHERE id = $1 AND mentor_id = $2', [assignmentId, req.user.id]);
  if (maRows.length === 0) return res.status(403).json({ message: 'Not your assignment' });

  const id = `fb_${uuidv4().split('-')[0]}`;
  await query(
    'INSERT INTO mentor_feedback (id, assignment_id, author_id, feedback) VALUES ($1, $2, $3, $4)',
    [id, assignmentId, req.user.id, feedback]
  );

  // Notify student
  const notifId = `notif_${uuidv4().split('-')[0]}`;
  await query(
    `INSERT INTO notifications (id, user_id, title, message, ref_type, ref_id)
     VALUES ($1, $2, 'New Mentor Feedback', 'Your mentor has added new feedback. Check your dashboard.', 'feedback', $3)`,
    [notifId, maRows[0].student_id, id]
  );

  res.status(201).json({ id, message: 'Feedback added' });
});

app.get('/api/mentor/feedback/:assignmentId', authenticate, async (req, res) => {
  // Mentor or assigned student can see feedback
  const { rows: maRows } = await query('SELECT * FROM mentorship_assignments WHERE id = $1', [req.params.assignmentId]);
  if (maRows.length === 0) return res.status(404).json({ message: 'Assignment not found' });

  const ma = maRows[0];
  if (req.user.role === 'mentor' && ma.mentor_id !== req.user.id) return res.status(403).json({ message: 'Access denied' });
  if (req.user.role === 'student' && ma.student_id !== req.user.id) return res.status(403).json({ message: 'Access denied' });
  if (!['mentor', 'student', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });

  const { rows } = await query(
    `SELECT mf.*, u.name AS author_name FROM mentor_feedback mf JOIN users u ON u.id = mf.author_id WHERE mf.assignment_id = $1 ORDER BY mf.created_at DESC`,
    [req.params.assignmentId]
  );
  res.json(rows);
});

// Learning goals
app.post('/api/mentor/learning-goals', authenticate, requireRole('mentor'), async (req, res) => {
  const { assignmentId, title, description } = req.body;
  if (!assignmentId || !title) return res.status(400).json({ message: 'assignmentId and title are required' });

  const { rows: maRows } = await query('SELECT * FROM mentorship_assignments WHERE id = $1 AND mentor_id = $2', [assignmentId, req.user.id]);
  if (maRows.length === 0) return res.status(403).json({ message: 'Not your assignment' });

  const id = `lg_${uuidv4().split('-')[0]}`;
  await query(
    'INSERT INTO learning_goals (id, assignment_id, title, description) VALUES ($1, $2, $3, $4)',
    [id, assignmentId, title, description || '']
  );

  res.status(201).json({ id, message: 'Learning goal added' });
});

app.get('/api/learning-goals/:assignmentId', authenticate, async (req, res) => {
  const { rows: maRows } = await query('SELECT * FROM mentorship_assignments WHERE id = $1', [req.params.assignmentId]);
  if (maRows.length === 0) return res.status(404).json({ message: 'Assignment not found' });

  const ma = maRows[0];
  if (req.user.role === 'mentor' && ma.mentor_id !== req.user.id) return res.status(403).json({ message: 'Access denied' });
  if (req.user.role === 'student' && ma.student_id !== req.user.id) return res.status(403).json({ message: 'Access denied' });
  if (!['mentor', 'student', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });

  const { rows } = await query('SELECT * FROM learning_goals WHERE assignment_id = $1 ORDER BY created_at ASC', [req.params.assignmentId]);
  res.json(rows);
});

app.patch('/api/learning-goals/:id/status', authenticate, requireRole('student'), async (req, res) => {
  const { status } = req.body;
  if (!['not_started', 'in_progress', 'completed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  // Verify the goal belongs to an assignment for this student
  const { rows } = await query(
    `SELECT lg.* FROM learning_goals lg JOIN mentorship_assignments ma ON ma.id = lg.assignment_id WHERE lg.id = $1 AND ma.student_id = $2`,
    [req.params.id, req.user.id]
  );
  if (rows.length === 0) return res.status(403).json({ message: 'Access denied' });

  await query('UPDATE learning_goals SET status = $1 WHERE id = $2', [status, req.params.id]);
  res.json({ message: 'Goal updated' });
});

// Student sees their mentorship info
app.get('/api/student/mentorship', authenticate, requireRole('student'), async (req, res) => {
  const { rows } = await query(
    `SELECT ma.id AS assignment_id, m.id AS mentor_id, m.name AS mentor_name, m.email AS mentor_email, m.profile AS mentor_profile, ma.created_at
     FROM mentorship_assignments ma JOIN users m ON m.id = ma.mentor_id
     WHERE ma.student_id = $1 ORDER BY ma.created_at DESC`,
    [req.user.id]
  );
  // Strip sensitive fields
  res.json(rows.map(r => {
    if (r.mentor_profile) delete r.mentor_profile.password_hash;
    return r;
  }));
});

// ═══════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════
app.get('/api/notifications', authenticate, async (req, res) => {
  const { rows } = await query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.id]);
  res.json(rows);
});

app.patch('/api/notifications/:id/read', authenticate, async (req, res) => {
  await query('UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════════════
//  CATCH-ALL for unknown API routes
// ═══════════════════════════════════════════════════════════════
app.all('/api/*', (_req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// ═══════════════════════════════════════════════════════════════
//  STARTUP
// ═══════════════════════════════════════════════════════════════
let dbInitialized = false;
export async function ensureDbReady() {
  if (!dbInitialized) {
    await initDb();
    await seedAssessments();
    await bootstrapAdmin();
    dbInitialized = true;
  }
}

async function start() {
  try {
    await ensureDbReady();
    app.listen(PORT, () => {
      console.log(`Skill Connect API running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (!process.env.VERCEL) {
  start();
}

export default app;

