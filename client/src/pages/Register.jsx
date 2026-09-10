import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GraduationCap, Building2, AlertCircle, ArrowRight, Compass, Award } from "lucide-react";
import "./login.css";

export default function Register() {
  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [degree, setDegree] = useState("");
  const [institution, setInstitution] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [expertise, setExpertise] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload = {
        email,
        password,
        role,
        name,
        degree: role === 'student' ? degree : undefined,
        institution: role === 'student' ? institution : undefined,
        companyName: role === 'recruiter' ? companyName : undefined,
        expertise: role === 'mentor' ? expertise : undefined
      };

      const user = await register(payload);
      if (user.role === "student") navigate("/student");
      else if (user.role === "recruiter") navigate("/recruiter");
      else if (user.role === "mentor") navigate("/mentor");
      else navigate("/opportunities");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card register-card">
        {/* Brand */}
        <div className="logo-section">
          <div className="emblem-container" style={{ background: '#eff6ff', borderColor: '#3b82f6' }}>
            <Compass size={28} color="#2563eb" />
          </div>
          <h1 style={{ color: '#1e3a8a' }}>Skill Connect</h1>
          <p className="portal-tagline">Academia–Industry Collaboration & Talent Registration</p>
          <div className="gold-accent-line" style={{ background: 'linear-gradient(90deg, #2563eb, #3b82f6)' }}></div>
        </div>

        {/* Role Toggle */}
        <div className="role-tabs" style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
          <button
            type="button"
            className={`role-tab ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
            style={{ flex: 1, padding: '10px 8px' }}
          >
            <GraduationCap size={16} />
            <span>Student</span>
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'recruiter' ? 'active' : ''}`}
            onClick={() => setRole('recruiter')}
            style={{ flex: 1, padding: '10px 8px' }}
          >
            <Building2 size={16} />
            <span>Recruiter</span>
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'mentor' ? 'active' : ''}`}
            onClick={() => setRole('mentor')}
            style={{ flex: 1, padding: '10px 8px' }}
          >
            <Award size={16} />
            <span>Mentor</span>
          </button>
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a' }}>
          {role === 'student' && 'Register as Student Candidate'}
          {role === 'recruiter' && 'Register as Industry Recruiter'}
          {role === 'mentor' && 'Register as Academic / Industry Mentor'}
        </h2>
        <p className="subtitle" style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
          {role === 'student' && 'Build your verified skill profile, take standardized assessments, and apply for approved internships and entry-level positions.'}
          {role === 'recruiter' && 'Post internships, review candidate skill compatibility, and manage applications. (Requires administrator approval before publishing opportunities.)'}
          {role === 'mentor' && 'Guide students, review skill progression, and assign targeted learning milestones. (Requires administrator approval before student assignment.)'}
        </p>

        {error && (
          <div className="auth-error-box" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder={role === 'recruiter' ? "Contact Person Name" : "Your full name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Password (min 6 chars) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>
          </div>

          {/* Student Fields */}
          {role === 'student' && (
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Degree / Program
                </label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech Computer Science, BCA, B.Sc"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Academic Institution / University
                </label>
                <input
                  type="text"
                  placeholder="e.g. National Institute of Technology"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>
            </div>
          )}

          {/* Recruiter Fields */}
          {role === 'recruiter' && (
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Company / Organization Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Infosys, TCS, Razorpay, or Hospital/Enterprise"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>
          )}

          {/* Mentor Fields */}
          {role === 'mentor' && (
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Primary Domain of Expertise *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Full-Stack Web Development, Data Science, AI/ML, Cloud Infrastructure"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-block"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px'
            }}
          >
            {isSubmitting ? "Creating Account..." : "Create Account"} <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-footer-note" style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#64748b' }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
