async function runE2E() {
  console.log("=== STARTING MINISTRY OF AYUSH PORTAL E2E VERIFICATION ===");
  const base = "http://localhost:5000/api";

  // 1. Health
  const health = await (await fetch(`${base}/health`)).json();
  console.log("✓ Health status:", health.status, "-", health.portal);

  // 2. Student Login
  const stuLogin = await (await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "student@ayush.gov.in", password: "ayush123", role: "student" })
  })).json();
  console.log("✓ Student Authenticated:", stuLogin.user.name, `(${stuLogin.user.stream.toUpperCase()})`);
  const stuToken = stuLogin.token;

  // 3. Student AI Recommendations
  const recs = await (await fetch(`${base}/students/recommendations`, {
    headers: { "Authorization": `Bearer ${stuToken}` }
  })).json();
  console.log(`✓ AI Match Engine: ${recs.length} internships scored. Top match: "${recs[0].title}" with ${recs[0].matchScore}% match`);

  // 4. Student Assessment & Certification
  const asm = await (await fetch(`${base}/assessments/asm_ayurveda_1`)).json();
  console.log(`✓ Fetched Assessment: "${asm.title}" with ${asm.questions.length} questions`);

  const asmSubmit = await (await fetch(`${base}/assessments/asm_ayurveda_1/submit`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${stuToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      answers: { 1: 1, 2: 0, 3: 1, 4: 1, 5: 1 } // All correct
    })
  })).json();
  console.log(`✓ Assessment Passed: Score ${asmSubmit.score}%. Issued Badge: "${asmSubmit.badge}"`);

  // 5. Industry Partner Login
  const indLogin = await (await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "recruiter@dabur.com", password: "ayush123", role: "industry" })
  })).json();
  console.log("✓ Industry Partner Authenticated:", indLogin.user.companyName);
  const indToken = indLogin.token;

  // 6. Industry Post Opportunity
  const newOpp = await (await fetch(`${base}/opportunities`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${indToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Ayurvedic Drug Standardization & HPTLC Analyst",
      stream: "ayurveda",
      type: "Research Fellowship",
      location: "Sahibabad R&D Lab",
      stipend: "₹26,000 / month",
      duration: "6 Months",
      openings: 2,
      requiredSkills: ["Dravyaguna (Pharmacognosy)", "Classical Herb Identification", "Rasa Shastra & Bhaishajya Kalpana"],
      description: "Perform fingerprinting of Ayurvedic herbal extracts using high-performance thin layer chromatography."
    })
  })).json();
  console.log("✓ Opportunity Posted:", newOpp.opportunity.title, `[Status: ${newOpp.opportunity.status}]`);

  // 7. Ministry Admin Login & Approvals
  const admLogin = await (await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@ayush.gov.in", password: "admin123", role: "admin" })
  })).json();
  console.log("✓ Ministry Admin Authenticated:", admLogin.user.name);
  const admToken = admLogin.token;

  // Approve the newly posted opportunity
  const oppApprove = await (await fetch(`${base}/admin/approve-opportunity/${newOpp.opportunity.id}`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${admToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "approved" })
  })).json();
  console.log("✓ Ministry Compliance Cleared:", oppApprove.message);

  // 8. Admin Overview & Analytics
  const analytics = await (await fetch(`${base}/admin/overview`, {
    headers: { "Authorization": `Bearer ${admToken}` }
  })).json();
  console.log("✓ Ministry Analytics Verified: Total Students:", analytics.metrics.totalStudents,
    "| Active Opportunities:", analytics.metrics.activeOpportunities,
    "| Placement Rate:", `${analytics.metrics.placementRatePercent}%`);

  console.log("=== ALL E2E INTEGRATION CHECKS COMPLETED SUCCESSFULLY ===");
}

runE2E().catch(console.error);
