import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Compass, AlertCircle, ArrowRight, Lock, Mail } from "lucide-react";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      if (user.role === "student") navigate("/student");
      else if (user.role === "recruiter") navigate("/recruiter");
      else if (user.role === "mentor") navigate("/mentor");
      else if (user.role === "admin") navigate("/admin");
      else navigate("/opportunities");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Brand Section */}
        <div className="logo-section">
          <div className="emblem-container" style={{ background: '#eff6ff', borderColor: '#3b82f6' }}>
            <Compass size={28} color="#2563eb" />
          </div>
          <h1 style={{ color: '#1e3a8a' }}>Skill Connect</h1>
          <p className="portal-tagline">Academia–Industry Collaboration Portal</p>
          <div className="gold-accent-line" style={{ background: 'linear-gradient(90deg, #2563eb, #3b82f6)' }}></div>
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a' }}>Sign In to Your Account</h2>
        <p className="subtitle" style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>
          Access your personalized dashboard, skill assessments, opportunities, and mentorship.
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
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                required
                placeholder="you@institution.edu or you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

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
              gap: '8px'
            }}
          >
            {isSubmitting ? "Signing In..." : "Sign In"} <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-footer-note" style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
            Register as Student, Recruiter, or Mentor
          </Link>
        </div>
      </div>
    </div>
  );
}