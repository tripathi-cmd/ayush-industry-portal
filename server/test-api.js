async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@ayush.gov.in', password: 'ayush123' })
    });
    const data = await res.json();
    console.log('Login Response:', res.status, data.user?.name, 'Role:', data.user?.role);

    // Test recommendations
    const recRes = await fetch('http://localhost:5000/api/students/recommendations', {
      headers: { 'Authorization': `Bearer ${data.token}` }
    });
    const recs = await recRes.json();
    console.log('Recommendations count:', recs.length, 'Top match:', recs[0]?.title, 'Score:', recs[0]?.matchScore + '%');
  } catch (err) {
    console.error('API Test Error:', err);
  }
}

test();
