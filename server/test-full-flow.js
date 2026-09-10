import assert from 'node:assert';
import { calculateMatchScore, generateSkillGapAdvice } from './services/skillMatcher.js';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

/** Helper to manage cookies across requests */
class TestClient {
  constructor(name) {
    this.name = name;
    this.cookie = null;
  }

  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (this.cookie) {
      headers['Cookie'] = this.cookie;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers
    });

    // Capture set-cookie
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/sc_session=([^;]+)/);
      if (match) {
        this.cookie = `sc_session=${match[1]}`;
      }
    }

    let body = null;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      body = await res.json();
    } else {
      body = await res.text();
    }

    return { status: res.status, headers: res.headers, body };
  }

  post(path, data) {
    return this.request(path, { method: 'POST', body: JSON.stringify(data) });
  }

  get(path) {
    return this.request(path, { method: 'GET' });
  }

  put(path, data) {
    return this.request(path, { method: 'PUT', body: JSON.stringify(data) });
  }

  patch(path, data) {
    return this.request(path, { method: 'PATCH', body: JSON.stringify(data) });
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('   SKILL CONNECT MVP - TEST SUITE');
  console.log('========================================\n');

  // -------------------------------------------------------------
  // 1. UNIT TEST: Exact Token Skill Matching & False Substring Prevention
  // -------------------------------------------------------------
  console.log('[1/8] Testing Exact Token Skill Matching...');
  {
    // Java should NEVER match JavaScript
    const match1 = calculateMatchScore(['Java', 'SQL'], ['JavaScript', 'React']);
    assert.strictEqual(match1.matchScore, 0, 'Java must NOT match JavaScript (false substring)');
    assert.deepStrictEqual(match1.matchingSkills, [], 'Matching skills should be empty');
    assert.strictEqual(match1.missingSkills.length, 2);

    // Exact case-insensitive match
    const match2 = calculateMatchScore(['javascript', 'react', 'node.js'], ['JavaScript', 'React', 'Docker']);
    assert.strictEqual(match2.matchScore, 67, '2 out of 3 skills match = 67%');
    assert.strictEqual(match2.matchingSkills.length, 2);
    assert.deepStrictEqual(match2.missingSkills, ['Docker']);

    // Empty required skills returns null matchScore
    const match3 = calculateMatchScore(['React'], []);
    assert.strictEqual(match3.matchScore, null, 'Empty requirements should return null matchScore');

    // Skill gap advice
    const advice = generateSkillGapAdvice(['Docker', 'Kubernetes']);
    assert.ok(advice.includes('Docker') && advice.includes('Kubernetes'));

    console.log('  ✓ Skill matching unit tests passed (no false substring matches).');
  }

  // -------------------------------------------------------------
  // 2. HEALTH CHECK
  // -------------------------------------------------------------
  console.log('\n[2/8] Testing Health Endpoint...');
  {
    const client = new TestClient('guest');
    const res = await client.get('/health');
    assert.strictEqual(res.status, 200, `Health check returned ${res.status}`);
    assert.strictEqual(res.body.portal, 'Skill Connect API');
    assert.strictEqual(res.body.db, 'connected');
    console.log('  ✓ API and Database are healthy.');
  }

  // -------------------------------------------------------------
  // 3. SECURITY & FORBIDDEN ACTIONS
  // -------------------------------------------------------------
  console.log('\n[3/8] Testing Security & RBAC Enforcement...');
  {
    const guest = new TestClient('guest');

    // 3.1 Public admin registration must be rejected
    const adminReg = await guest.post('/auth/register', {
      email: 'hacker_admin@example.com',
      password: 'password123',
      name: 'Fake Admin',
      role: 'admin'
    });
    assert.strictEqual(adminReg.status, 400, 'Public admin registration must return 400');
    console.log('  ✓ Public admin registration blocked.');

    // 3.2 Unauthenticated access to protected routes must be rejected
    const unauthMe = await guest.get('/auth/me');
    assert.strictEqual(unauthMe.status, 401, 'Unauthenticated /auth/me must return 401');

    const unauthPost = await guest.post('/opportunities', { title: 'Ghost Opp' });
    assert.strictEqual(unauthPost.status, 401, 'Unauthenticated /opportunities must return 401');
    console.log('  ✓ Unauthenticated access blocked on protected routes.');

    // 3.3 Unknown API routes return 404 JSON
    const unknownRoute = await guest.get('/unknown-endpoint');
    assert.strictEqual(unknownRoute.status, 404);
    assert.strictEqual(typeof unknownRoute.body, 'object');
    console.log('  ✓ Unknown API routes return 404 JSON.');
  }

  // Generate unique test suffix to ensure test isolation
  const runId = Math.random().toString(36).substring(2, 7);

  // -------------------------------------------------------------
  // 4. RECRUITER LIFECYCLE: Registration -> Pending State -> Admin Approval
  // -------------------------------------------------------------
  console.log('\n[4/8] Testing Recruiter Registration & Admin Approval Flow...');
  const recruiter = new TestClient('recruiter');
  const admin = new TestClient('admin');
  let recruiterId;
  let postedOppId;

  {
    // 4.1 Register Recruiter
    const regRes = await recruiter.post('/auth/register', {
      email: `recruiter_${runId}@company.com`,
      password: 'RecruiterPassword123!',
      role: 'recruiter',
      name: 'Jane Recruiter',
      companyName: `Innovate Tech ${runId}`
    });
    assert.strictEqual(regRes.status, 201, `Recruiter registration failed with ${regRes.status}`);
    assert.strictEqual(regRes.body.user.role, 'recruiter');
    assert.strictEqual(regRes.body.user.approval, 'pending', 'Recruiter must start in pending approval');
    recruiterId = regRes.body.user.id;
    console.log('  ✓ Recruiter registered (status: pending).');

    // 4.2 Pending recruiter cannot post opportunities
    const prematurePost = await recruiter.post('/opportunities', {
      title: 'Premature Job',
      requiredSkills: ['React']
    });
    assert.strictEqual(prematurePost.status, 403, 'Pending recruiter must be forbidden from posting');
    console.log('  ✓ Pending recruiter blocked from posting opportunities.');

    // 4.3 Login Admin (using bootstrap credentials)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@skillconnect.org';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecure2026!';
    const adminLoginRes = await admin.post('/auth/login', {
      email: adminEmail,
      password: adminPassword
    });
    assert.strictEqual(adminLoginRes.status, 200, `Admin login failed with ${adminLoginRes.status}`);
    assert.strictEqual(adminLoginRes.body.user.role, 'admin');
    console.log('  ✓ Admin authenticated via bootstrapped credentials.');

    // 4.4 Admin verifies pending queue and approves recruiter
    const pendingQueue = await admin.get('/admin/pending');
    assert.strictEqual(pendingQueue.status, 200);
    const foundPending = pendingQueue.body.pendingUsers.find(u => u.id === recruiterId);
    assert.ok(foundPending, 'Newly registered recruiter must appear in admin pending queue');

    const approveRes = await admin.patch(`/admin/users/${recruiterId}/approval`, { approval: 'approved' });
    assert.strictEqual(approveRes.status, 200);
    console.log('  ✓ Admin approved recruiter account.');

    // 4.5 Approved recruiter posts opportunity
    const postRes = await recruiter.post('/opportunities', {
      title: `Full-Stack Developer Intern ${runId}`,
      type: 'Internship',
      location: 'Remote',
      stipend: '₹30,000 / month',
      duration: '6 Months',
      openings: 3,
      requiredSkills: ['React', 'Node.js', 'PostgreSQL'],
      description: 'Build modern responsive web applications and backend APIs.',
      eligibility: 'Computer Science students'
    });
    assert.strictEqual(postRes.status, 201);
    assert.strictEqual(postRes.body.opportunity.status, 'pending', 'Opportunity must start pending admin review');
    postedOppId = postRes.body.opportunity.id;
    console.log('  ✓ Recruiter posted opportunity (status: pending admin review).');

    // 4.6 Admin approves opportunity
    const oppApproveRes = await admin.patch(`/admin/opportunities/${postedOppId}/status`, { status: 'approved' });
    assert.strictEqual(oppApproveRes.status, 200);
    console.log('  ✓ Admin approved opportunity listing.');
  }

  // -------------------------------------------------------------
  // 5. STUDENT LIFECYCLE: Registration -> Skills -> Assessment -> Application
  // -------------------------------------------------------------
  console.log('\n[5/8] Testing Student Profile, Assessment & Application Flow...');
  const student = new TestClient('student');
  let studentId;
  let applicationId;

  {
    // 5.1 Register Student
    const stuReg = await student.post('/auth/register', {
      email: `student_${runId}@college.edu`,
      password: 'StudentPassword123!',
      role: 'student',
      name: 'Alex Student',
      degree: 'B.Tech CS',
      institution: 'National Tech Institute'
    });
    assert.strictEqual(stuReg.status, 201);
    assert.strictEqual(stuReg.body.user.approval, 'approved', 'Students are approved immediately');
    studentId = stuReg.body.user.id;
    console.log('  ✓ Student registered.');

    // 5.2 Update Student Skills
    const skillUpdate = await student.put('/students/profile', {
      skills: ['React', 'Node.js', 'Git', 'Problem Solving'],
      bio: 'Enthusiastic web developer passionate about full-stack architectures.'
    });
    assert.strictEqual(skillUpdate.status, 200);
    assert.strictEqual(skillUpdate.body.user.profile.skills.length, 4);
    console.log('  ✓ Student profile & skills updated.');

    // 5.3 Fetch Standardized Assessments & Submit Test
    const asmList = await student.get('/assessments');
    assert.strictEqual(asmList.status, 200);
    assert.ok(asmList.body.length > 0, 'Seeded assessments must be present');

    const targetAsm = asmList.body[0];
    const asmDetail = await student.get(`/assessments/${targetAsm.id}`);
    assert.strictEqual(asmDetail.status, 200);
    // Answer keys MUST NOT be returned to the client before submission
    assert.strictEqual(asmDetail.body.questions[0].correctAnswer, undefined, 'Answer keys must not be leaked');

    // Submit answers
    const submitRes = await student.post(`/assessments/${targetAsm.id}/submit`, {
      answers: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    });
    assert.strictEqual(submitRes.status, 200);
    assert.ok(submitRes.body.score !== undefined);
    assert.ok(Array.isArray(submitRes.body.review), 'Submission must return question review with rationales');

    const attempts = await student.get('/assessments/attempts/me');
    assert.strictEqual(attempts.status, 200);
    assert.ok(attempts.body.length >= 1, 'Attempt history must be recorded in DB');
    console.log(`  ✓ Assessment taken (score: ${submitRes.body.score}%) and recorded in database.`);

    // 5.4 Check Recommendations with Skill Matching
    const recs = await student.get('/students/recommendations');
    assert.strictEqual(recs.status, 200);
    const targetOpp = recs.body.find(o => o.id === postedOppId);
    assert.ok(targetOpp, 'Approved opportunity must appear in student recommendations');
    assert.strictEqual(targetOpp.matchingSkills.includes('React'), true);
    assert.strictEqual(targetOpp.matchingSkills.includes('Node.js'), true);
    assert.strictEqual(targetOpp.missingSkills.includes('PostgreSQL'), true);
    console.log(`  ✓ Recommendation scored: ${targetOpp.matchScore}% match for student.`);

    // 5.5 Student Applies for Opportunity
    const appRes = await student.post('/applications', { opportunityId: postedOppId });
    assert.strictEqual(appRes.status, 201);
    applicationId = appRes.body.application.id;
    assert.strictEqual(appRes.body.application.status, 'applied');
    assert.ok(appRes.body.application.match_snapshot, 'Application must capture match snapshot at time of application');
    console.log('  ✓ Application submitted with frozen skill match snapshot.');

    // 5.6 Duplicate applications must be rejected with 409
    const dupApp = await student.post('/applications', { opportunityId: postedOppId });
    assert.strictEqual(dupApp.status, 409, 'Duplicate application must return 409 Conflict');
    console.log('  ✓ Duplicate application prevented.');
  }

  // -------------------------------------------------------------
  // 6. RECRUITER PIPELINE & INTERVIEW SCHEDULING
  // -------------------------------------------------------------
  console.log('\n[6/8] Testing Recruiter Candidate Evaluation & Interview Scheduling...');
  {
    // 6.1 Recruiter views applications for own listings
    const appsRes = await recruiter.get('/applications');
    assert.strictEqual(appsRes.status, 200);
    const candidateApp = appsRes.body.find(a => a.id === applicationId);
    assert.ok(candidateApp, 'Recruiter must see student application');

    // 6.2 Recruiter shortlists candidate
    const shortlistRes = await recruiter.patch(`/api/applications/${applicationId}/status`.replace('/api/api', '/api'), {
      status: 'shortlisted'
    });
    assert.strictEqual(shortlistRes.status, 200);
    assert.strictEqual(shortlistRes.body.application.status, 'shortlisted');

    // 6.3 Recruiter schedules interview with meeting URL
    const interviewRes = await recruiter.patch(`/applications/${applicationId}/status`, {
      status: 'interview_scheduled',
      interviewDetails: {
        date: new Date(Date.now() + 86400000).toISOString(),
        meetingUrl: 'https://meet.google.com/test-room-link',
        notes: 'Technical discussion on React component architecture'
      }
    });
    assert.strictEqual(interviewRes.status, 200);
    assert.strictEqual(interviewRes.body.application.status, 'interview_scheduled');
    console.log('  ✓ Candidate shortlisted & interview scheduled with meeting link.');

    // 6.4 Student checks notifications and sees update
    const notifs = await student.get('/notifications');
    assert.strictEqual(notifs.status, 200);
    assert.ok(notifs.body.length > 0, 'Student must receive notification of interview');
    console.log('  ✓ Student received real-time notification in database.');
  }

  // -------------------------------------------------------------
  // 7. MENTORSHIP LIFECYCLE: Registration -> Admin Assign -> Feedback & Goals
  // -------------------------------------------------------------
  console.log('\n[7/8] Testing Mentor Registration, Assignment, Feedback & Goals...');
  const mentor = new TestClient('mentor');
  let mentorId;
  let assignmentId;

  {
    // 7.1 Register Mentor
    const menReg = await mentor.post('/auth/register', {
      email: `mentor_${runId}@university.edu`,
      password: 'MentorPassword123!',
      role: 'mentor',
      name: 'Dr. Alan Mentor',
      expertise: 'Distributed Systems & Cloud Engineering'
    });
    assert.strictEqual(menReg.status, 201);
    assert.strictEqual(menReg.body.user.approval, 'pending');
    mentorId = menReg.body.user.id;

    // 7.2 Admin approves mentor
    await admin.patch(`/admin/users/${mentorId}/approval`, { approval: 'approved' });
    console.log('  ✓ Mentor registered and approved by Admin.');

    // 7.3 Admin pairs Mentor with Student
    const pairRes = await admin.post('/admin/mentorship/assign', {
      mentorId,
      studentId
    });
    assert.strictEqual(pairRes.status, 201);
    assignmentId = pairRes.body.id;
    console.log('  ✓ Admin established mentorship assignment.');

    // 7.4 Mentor views assigned student
    const assignedStudents = await mentor.get('/mentor/students');
    assert.strictEqual(assignedStudents.status, 200);
    assert.ok(assignedStudents.body.some(s => s.student_id === studentId));

    // 7.5 Mentor posts feedback
    const fbRes = await mentor.post('/mentor/feedback', {
      assignmentId,
      feedback: 'Great progress on React fundamentals. Focus next on PostgreSQL indexing and connection pools.'
    });
    assert.strictEqual(fbRes.status, 201);

    // 7.6 Mentor assigns learning goal
    const goalRes = await mentor.post('/mentor/learning-goals', {
      assignmentId,
      title: 'Complete PostgreSQL Database Indexing Lab',
      description: 'Implement B-Tree indexes and analyze query execution plans.'
    });
    assert.strictEqual(goalRes.status, 201);
    const goalId = goalRes.body.id;
    console.log('  ✓ Mentor posted actionable feedback and learning goal.');

    // 7.7 Student sees mentorship and updates goal status
    const stuMentorship = await student.get('/student/mentorship');
    assert.strictEqual(stuMentorship.status, 200);
    assert.strictEqual(stuMentorship.body[0].mentor_name, 'Dr. Alan Mentor');

    const stuGoals = await student.get(`/learning-goals/${assignmentId}`);
    assert.strictEqual(stuGoals.status, 200);
    assert.strictEqual(stuGoals.body.length, 1);

    const goalUpdate = await student.patch(`/learning-goals/${goalId}/status`, {
      status: 'completed'
    });
    assert.strictEqual(goalUpdate.status, 200);
    console.log('  ✓ Student viewed mentor feedback and marked learning goal as completed.');
  }

  // -------------------------------------------------------------
  // 8. LOGOUT & SESSION INVALIDATION
  // -------------------------------------------------------------
  console.log('\n[8/8] Testing Logout & Session Invalidation...');
  {
    const logoutRes = await student.post('/auth/logout', {});
    assert.strictEqual(logoutRes.status, 200);

    // Token must now be revoked
    const meAfterLogout = await student.get('/auth/me');
    assert.strictEqual(meAfterLogout.status, 401, 'Revoked session must be denied access');
    console.log('  ✓ Session revoked in database upon logout.');
  }

  console.log('\n========================================================');
  console.log('   ALL SKILL CONNECT INTEGRATION TESTS PASSED (100%)');
  console.log('========================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
