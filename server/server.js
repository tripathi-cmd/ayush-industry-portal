import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { calculateMatchScore, generateSkillGapAdvice, INDUSTRY_SECTORS } from './services/skillMatcher.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'skillconnect-secure-jwt-token-key-2026';

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Auth Token Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired authentication token' });
  }
};

// Optional auth middleware
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      // Ignore token error for optional auth
    }
  }
  next();
};

/* ==========================================================================
   HEALTH CHECK
   ========================================================================== */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    portal: 'SkillConnect - Multi-Industry Academia Portal API',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

/* ==========================================================================
   INDUSTRY TAXONOMY
   ========================================================================== */
app.get('/api/taxonomy', (req, res) => {
  res.json(INDUSTRY_SECTORS);
});

/* ==========================================================================
   AUTHENTICATION ROUTES
   ========================================================================== */
// Register
app.post('/api/auth/register', (req, res) => {
  const { email, password, role, name, stream, degree, institution, companyName, industrySector, licenseNumber } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password, and role are required' });
  }

  const data = db.read();
  const existing = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  const newUser = {
    id: `usr_${Date.now()}`,
    email: email.toLowerCase(),
    password: hashedPassword,
    role,
    name: name || (role === 'industry' ? companyName : 'Professional'),
    createdAt: new Date().toISOString()
  };

  if (role === 'student') {
    newUser.stream = stream || 'technology';
    newUser.degree = degree || 'Bachelor';
    newUser.institution = institution || 'University';
    newUser.skills = [];
    newUser.assessmentScores = [];
    newUser.documents = [];
  } else if (role === 'industry') {
    newUser.companyName = companyName || name || 'Enterprise';
    newUser.industrySector = industrySector || stream || 'technology';
    newUser.licenseNumber = licenseNumber || 'PENDING-SUBMISSION';
    newUser.certifications = [];
    newUser.verificationStatus = 'pending';
  }

  data.users.push(newUser);
  db.write(data);

  const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
  
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({
    token,
    user: userWithoutPassword,
    message: 'Registration successful'
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const data = db.read();
  const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials. User not found.' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid password. Please check your credentials.' });
  }

  if (role && user.role !== role) {
    return res.status(403).json({ message: `Account registered as ${user.role}. Please select the correct login role.` });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    token,
    user: userWithoutPassword,
    message: 'Login successful'
  });
});

// Current User Profile
app.get('/api/auth/me', authenticate, (req, res) => {
  const data = db.read();
  const user = data.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User profile not found' });
  }
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

/* ==========================================================================
   STUDENT ROUTES
   ========================================================================== */
// Update student profile
app.put('/api/students/profile', authenticate, (req, res) => {
  const data = db.read();
  const userIndex = data.users.findIndex(u => u.id === req.user.id);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'Student profile not found' });
  }

  const allowedUpdates = ['name', 'stream', 'degree', 'institution', 'phone', 'location', 'bio', 'skills'];
  allowedUpdates.forEach(key => {
    if (req.body[key] !== undefined) {
      data.users[userIndex][key] = req.body[key];
    }
  });

  db.write(data);
  const { password: _, ...updatedUser } = data.users[userIndex];
  res.json({ user: updatedUser, message: 'Profile updated successfully' });
});

// Upload/Register academic document
app.post('/api/students/upload-document', authenticate, (req, res) => {
  const { title, type } = req.body;
  const data = db.read();
  const userIndex = data.users.findIndex(u => u.id === req.user.id);
  if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

  const newDoc = {
    id: `doc_${Date.now()}`,
    title: title || 'Degree Certificate',
    type: type || 'Academic Record',
    status: 'verified',
    verifiedAt: new Date().toISOString().split('T')[0]
  };

  if (!data.users[userIndex].documents) {
    data.users[userIndex].documents = [];
  }
  data.users[userIndex].documents.push(newDoc);
  db.write(data);

  res.json({ document: newDoc, message: 'Document uploaded and verified' });
});

// Get AI Recommendations for student
app.get('/api/students/recommendations', authenticate, (req, res) => {
  const data = db.read();
  const student = data.users.find(u => u.id === req.user.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const approvedOpportunities = data.opportunities.filter(o => o.status === 'approved');

  const recommendations = approvedOpportunities.map(opp => {
    const matchAnalysis = calculateMatchScore(
      student.skills || [],
      opp.requiredSkills || [],
      student.stream,
      opp.stream
    );

    const advice = generateSkillGapAdvice(matchAnalysis.missingSkills, student.stream);

    return {
      ...opp,
      matchScore: matchAnalysis.matchScore,
      matchingSkills: matchAnalysis.matchingSkills,
      missingSkills: matchAnalysis.missingSkills,
      skillGapAdvice: advice
    };
  });

  recommendations.sort((a, b) => b.matchScore - a.matchScore);

  res.json(recommendations);
});

/* ==========================================================================
   ASSESSMENT ROUTES
   ========================================================================== */
// Get assessments
app.get('/api/assessments', optionalAuth, (req, res) => {
  const data = db.read();
  const { stream } = req.query;
  let assessments = data.assessments;

  if (stream) {
    assessments = assessments.filter(a => a.stream === stream);
  }

  const safeAssessments = assessments.map(asm => ({
    id: asm.id,
    stream: asm.stream,
    title: asm.title,
    durationMinutes: asm.durationMinutes,
    passingScore: asm.passingScore,
    description: asm.description,
    questionCount: asm.questions.length
  }));

  res.json(safeAssessments);
});

// Get single assessment with questions
app.get('/api/assessments/:id', (req, res) => {
  const data = db.read();
  const asm = data.assessments.find(a => a.id === req.params.id);
  if (!asm) return res.status(404).json({ message: 'Assessment module not found' });

  const clientQuestions = asm.questions.map(q => ({
    id: q.id,
    question: q.question,
    options: q.options
  }));

  res.json({
    id: asm.id,
    stream: asm.stream,
    title: asm.title,
    durationMinutes: asm.durationMinutes,
    passingScore: asm.passingScore,
    description: asm.description,
    questions: clientQuestions
  });
});

// Submit assessment answers
app.post('/api/assessments/:id/submit', authenticate, (req, res) => {
  const { answers } = req.body;
  const data = db.read();
  const asm = data.assessments.find(a => a.id === req.params.id);
  if (!asm) return res.status(404).json({ message: 'Assessment not found' });

  let correctCount = 0;
  const review = [];

  asm.questions.forEach(q => {
    const userAnswer = answers ? answers[q.id] : undefined;
    const isCorrect = userAnswer === q.correctAnswer;
    if (isCorrect) correctCount++;
    review.push({
      id: q.id,
      question: q.question,
      userAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect,
      rationale: q.rationale
    });
  });

  const percentage = Math.round((correctCount / asm.questions.length) * 100);
  const passed = percentage >= asm.passingScore;

  const userIndex = data.users.findIndex(u => u.id === req.user.id);
  if (userIndex !== -1) {
    if (!data.users[userIndex].assessmentScores) {
      data.users[userIndex].assessmentScores = [];
    }

    const badgeTitle = passed ? `Certified ${asm.title.split(' ')[0]} Specialist` : null;

    const record = {
      assessmentId: asm.id,
      stream: asm.stream,
      title: asm.title,
      score: percentage,
      passed,
      badge: badgeTitle,
      completedAt: new Date().toISOString()
    };

    const existingIndex = data.users[userIndex].assessmentScores.findIndex(s => s.title === asm.title);
    if (existingIndex >= 0) {
      data.users[userIndex].assessmentScores[existingIndex] = record;
    } else {
      data.users[userIndex].assessmentScores.push(record);
    }

    db.write(data);
  }

  res.json({
    score: percentage,
    passed,
    correctCount,
    totalQuestions: asm.questions.length,
    badge: passed ? `Certified ${asm.title.split(' ')[0]} Specialist` : null,
    review
  });
});

/* ==========================================================================
   OPPORTUNITIES (INTERNSHIPS & PLACEMENTS)
   ========================================================================== */
app.get('/api/opportunities', optionalAuth, (req, res) => {
  const data = db.read();
  const { stream, type, search } = req.query;
  let list = data.opportunities;

  if (!req.user || req.user.role === 'student') {
    list = list.filter(o => o.status === 'approved');
  }

  if (stream && stream !== 'all') {
    list = list.filter(o => o.stream === stream);
  }

  if (type && type !== 'all') {
    list = list.filter(o => o.type.toLowerCase().includes(type.toLowerCase()));
  }

  if (search) {
    const s = search.toLowerCase();
    list = list.filter(o => 
      o.title.toLowerCase().includes(s) || 
      o.companyName.toLowerCase().includes(s) ||
      o.location.toLowerCase().includes(s) ||
      (o.requiredSkills && o.requiredSkills.some(sk => sk.toLowerCase().includes(s)))
    );
  }

  if (req.user && req.user.role === 'student') {
    const student = data.users.find(u => u.id === req.user.id);
    if (student) {
      list = list.map(opp => {
        const analysis = calculateMatchScore(
          student.skills || [],
          opp.requiredSkills || [],
          student.stream,
          opp.stream
        );
        return {
          ...opp,
          matchScore: analysis.matchScore,
          matchingSkills: analysis.matchingSkills,
          missingSkills: analysis.missingSkills
        };
      });
    }
  }

  res.json(list);
});

// Single Opportunity
app.get('/api/opportunities/:id', optionalAuth, (req, res) => {
  const data = db.read();
  const opp = data.opportunities.find(o => o.id === req.params.id);
  if (!opp) return res.status(404).json({ message: 'Opportunity not found' });

  let result = { ...opp };
  if (req.user && req.user.role === 'student') {
    const student = data.users.find(u => u.id === req.user.id);
    if (student) {
      const matchAnalysis = calculateMatchScore(
        student.skills || [],
        opp.requiredSkills || [],
        student.stream,
        opp.stream
      );
      result.matchScore = matchAnalysis.matchScore;
      result.matchingSkills = matchAnalysis.matchingSkills;
      result.missingSkills = matchAnalysis.missingSkills;
    }
  }

  res.json(result);
});

// Post Opportunity (Industry Partner)
app.post('/api/opportunities', authenticate, (req, res) => {
  if (req.user.role !== 'industry' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only Industry Partners or Admin can post opportunities' });
  }

  const data = db.read();
  const user = data.users.find(u => u.id === req.user.id);

  const {
    title,
    stream,
    type,
    location,
    stipend,
    duration,
    openings,
    requiredSkills,
    description,
    eligibility
  } = req.body;

  if (!title || !stream) {
    return res.status(400).json({ message: 'Title and industry sector are required' });
  }

  const newOpp = {
    id: `opp_${Date.now()}`,
    postedBy: req.user.id,
    companyName: user ? (user.companyName || user.name) : 'Partner Company',
    title,
    stream: stream || 'technology',
    type: type || 'Internship',
    location: location || 'On-site',
    stipend: stipend || '₹15,000 / month',
    duration: duration || '6 Months',
    openings: parseInt(openings) || 2,
    status: req.user.role === 'admin' ? 'approved' : 'pending',
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : (requiredSkills ? requiredSkills.split(',').map(s => s.trim()) : []),
    description: description || '',
    eligibility: eligibility || 'Graduates / Final Year Students',
    postedAt: new Date().toISOString()
  };

  data.opportunities.unshift(newOpp);
  db.write(data);

  res.status(201).json({
    opportunity: newOpp,
    message: req.user.role === 'admin' 
      ? 'Opportunity published immediately' 
      : 'Opportunity submitted for compliance approval'
  });
});

/* ==========================================================================
   APPLICATIONS TRACKER & WORKFLOW
   ========================================================================== */
// Get applications
app.get('/api/applications', authenticate, (req, res) => {
  const data = db.read();
  let apps = data.applications || [];

  if (req.user.role === 'student') {
    apps = apps.filter(a => a.studentId === req.user.id);
  } else if (req.user.role === 'industry') {
    const user = data.users.find(u => u.id === req.user.id);
    const myOppIds = data.opportunities
      .filter(o => o.postedBy === req.user.id || (user && o.companyName === user.companyName))
      .map(o => o.id);

    apps = apps.filter(a => myOppIds.includes(a.opportunityId) || (user && a.companyName === user.companyName));
  }

  res.json(apps);
});

// Submit Application (Student)
app.post('/api/applications', authenticate, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can submit applications' });
  }

  const { opportunityId } = req.body;
  const data = db.read();

  const opp = data.opportunities.find(o => o.id === opportunityId);
  if (!opp) return res.status(404).json({ message: 'Opportunity not found' });

  const student = data.users.find(u => u.id === req.user.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const existing = data.applications.find(a => a.opportunityId === opportunityId && a.studentId === req.user.id);
  if (existing) {
    return res.status(409).json({ message: 'You have already applied for this position', application: existing });
  }

  const matchAnalysis = calculateMatchScore(
    student.skills || [],
    opp.requiredSkills || [],
    student.stream,
    opp.stream
  );

  const newApp = {
    id: `app_${Date.now()}`,
    opportunityId: opp.id,
    studentId: student.id,
    studentName: student.name,
    studentEmail: student.email,
    studentDegree: student.degree,
    companyName: opp.companyName,
    opportunityTitle: opp.title,
    matchScore: matchAnalysis.matchScore,
    matchingSkills: matchAnalysis.matchingSkills,
    missingSkills: matchAnalysis.missingSkills,
    status: 'applied',
    appliedAt: new Date().toISOString()
  };

  data.applications.unshift(newApp);

  data.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: student.id,
    title: 'Application Submitted',
    message: `Your application for ${opp.title} at ${opp.companyName} was received successfully.`,
    read: false,
    timestamp: new Date().toISOString()
  });

  db.write(data);

  res.status(201).json({
    application: newApp,
    message: 'Application submitted successfully'
  });
});

// Update Application Status & Schedule Interview
app.patch('/api/applications/:id/status', authenticate, (req, res) => {
  const { status, interviewDetails } = req.body;
  const data = db.read();

  const appIndex = data.applications.findIndex(a => a.id === req.params.id);
  if (appIndex === -1) return res.status(404).json({ message: 'Application not found' });

  if (status) {
    data.applications[appIndex].status = status;
  }

  if (interviewDetails) {
    data.applications[appIndex].interviewDetails = interviewDetails;
  }

  const studentId = data.applications[appIndex].studentId;
  const oppTitle = data.applications[appIndex].opportunityTitle;
  const comp = data.applications[appIndex].companyName;

  let msg = `Your application for ${oppTitle} has been updated to: ${status}.`;
  if (status === 'interview_scheduled' && interviewDetails) {
    msg = `Interview scheduled for ${oppTitle} with ${comp} on ${new Date(interviewDetails.dateTime).toLocaleString()}.`;
  } else if (status === 'offered') {
    msg = `Congratulations! You have been selected for ${oppTitle} at ${comp}!`;
  }

  data.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: studentId,
    title: `Application Update: ${status.replace('_', ' ').toUpperCase()}`,
    message: msg,
    read: false,
    timestamp: new Date().toISOString()
  });

  db.write(data);

  res.json({
    application: data.applications[appIndex],
    message: 'Application status updated'
  });
});

/* ==========================================================================
   ADMIN ROUTES
   ========================================================================== */
// Admin Dashboard Overview & Analytics
app.get('/api/admin/overview', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Restricted to Admin' });
  }

  const data = db.read();
  const students = data.users.filter(u => u.role === 'student');
  const industry = data.users.filter(u => u.role === 'industry');
  const verifiedIndustry = industry.filter(u => u.verificationStatus === 'verified');
  const pendingIndustry = industry.filter(u => u.verificationStatus === 'pending');
  const approvedOpportunities = data.opportunities.filter(o => o.status === 'approved');
  const pendingOpportunities = data.opportunities.filter(o => o.status === 'pending');
  const placements = data.applications.filter(a => a.status === 'offered' || a.status === 'accepted');

  res.json({
    metrics: {
      totalStudents: students.length,
      totalIndustryPartners: industry.length,
      verifiedPartners: verifiedIndustry.length,
      pendingPartnerApprovals: pendingIndustry.length,
      activeOpportunities: approvedOpportunities.length,
      pendingOpportunityApprovals: pendingOpportunities.length,
      totalApplications: data.applications.length,
      successfulPlacements: placements.length,
      placementRatePercent: data.applications.length > 0 ? Math.round((placements.length / data.applications.length) * 100) : 0
    },
    sectorDistribution: [
      { name: 'Technology', students: 120, opportunities: 45, placements: 38 },
      { name: 'Healthcare', students: 85, opportunities: 32, placements: 26 },
      { name: 'Finance', students: 60, opportunities: 28, placements: 22 },
      { name: 'Manufacturing', students: 55, opportunities: 20, placements: 15 },
      { name: 'AYUSH', students: 54, opportunities: 28, placements: 19 }
    ],
    skillGaps: [
      { skill: 'Fullstack Development', demand: 95, supply: 65 },
      { skill: 'Machine Learning', demand: 90, supply: 42 },
      { skill: 'Cloud Architecture', demand: 88, supply: 50 },
      { skill: 'Clinical Research', demand: 75, supply: 55 },
      { skill: 'Financial Analysis', demand: 82, supply: 70 },
      { skill: 'Project Management', demand: 80, supply: 60 }
    ],
    placementTrends: [
      { month: 'Apr', placements: 8 },
      { month: 'May', placements: 12 },
      { month: 'Jun', placements: 18 },
      { month: 'Jul', placements: 25 },
      { month: 'Aug', placements: 35 },
      { month: 'Sep', placements: 48 }
    ]
  });
});

// Admin Review Queues
app.get('/api/admin/pending', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Restricted to Admin' });
  }

  const data = db.read();
  const pendingPartners = data.users.filter(u => u.role === 'industry' && u.verificationStatus === 'pending');
  const pendingOpportunities = data.opportunities.filter(o => o.status === 'pending');

  res.json({
    pendingPartners,
    pendingOpportunities
  });
});

// Verify Industry Partner (Admin)
app.post('/api/admin/verify-partner/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Restricted to Admin' });

  const { status } = req.body;
  const data = db.read();
  const user = data.users.find(u => u.id === req.params.id && u.role === 'industry');

  if (!user) return res.status(404).json({ message: 'Industry partner not found' });

  user.verificationStatus = status || 'verified';
  user.verifiedAt = new Date().toISOString().split('T')[0];
  db.write(data);

  res.json({ partner: user, message: `Partner status updated to ${user.verificationStatus}` });
});

// Approve Opportunity (Admin)
app.post('/api/admin/approve-opportunity/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Restricted to Admin' });

  const { status } = req.body;
  const data = db.read();
  const opp = data.opportunities.find(o => o.id === req.params.id);

  if (!opp) return res.status(404).json({ message: 'Opportunity not found' });

  opp.status = status || 'approved';
  db.write(data);

  res.json({ opportunity: opp, message: `Opportunity status updated to ${opp.status}` });
});

/* ==========================================================================
   NOTIFICATIONS
   ========================================================================== */
app.get('/api/notifications', authenticate, (req, res) => {
  const data = db.read();
  const notifs = (data.notifications || []).filter(n => n.userId === req.user.id);
  res.json(notifs);
});

app.patch('/api/notifications/:id/read', authenticate, (req, res) => {
  const data = db.read();
  const notif = (data.notifications || []).find(n => n.id === req.params.id && n.userId === req.user.id);
  if (notif) {
    notif.read = true;
    db.write(data);
  }
  res.json({ success: true });
});

/* ==========================================================================
   ERROR HANDLING
   ========================================================================== */
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`✓ SkillConnect Backend running at http://localhost:${PORT}`);
  console.log(`✓ API Health Check: http://localhost:${PORT}/api/health`);
});
