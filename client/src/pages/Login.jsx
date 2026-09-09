import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, GraduationCap, Building2, AlertCircle, ArrowRight } from "lucide-react";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("student@ayush.gov.in");
  const [password, setPassword] = useState("ayush123");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (newRole) => {
    setRole(newRole);
    if (newRole === "student") {
      setEmail("student@ayush.gov.in");
      setPassword("ayush123");
    } else if (newRole === "industry") {
      setEmail("recruiter@dabur.com");
      setPassword("ayush123");
    } else if (newRole === "admin") {
      setEmail("admin@ayush.gov.in");
      setPassword("admin123");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = await login(email, password, role);
      if (user.role === "student") navigate("/student");
      else if (user.role === "industry") navigate("/industry");
      else if (user.role === "admin") navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuick = async (demoRole) => {
    setError("");
    setIsSubmitting(true);
    try {
      const user = await quickLogin(demoRole);
      if (user.role === "student") navigate("/student");
      else if (user.role === "industry") navigate("/industry");
      else if (user.role === "admin") navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Quick sign in failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Ministry Badge */}
        <div className="logo-section">
          <div className="emblem-container">
            <span className="emblem-leaf">🌿</span>
          </div>
          <h1>Ministry of Ayush</h1>
          <p className="portal-tagline">Industry Partnership & Skill Mapping Portal</p>
          <div className="gold-accent-line"></div>
        </div>

        {/* Role Toggle Tabs */}
        <div className="role-tabs">
          <button
            type="button"
            className={`role-tab ${role === 'student' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('student')}
          >
            <GraduationCap size={16} />
            <span>Student</span>
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'industry' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('industry')}
          >
            <Building2 size={16} />
            <span>Industry</span>
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'admin' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('admin')}
          >
            <ShieldCheck size={16} />
            <span>Ministry Admin</span>
          </button>
        </div>

        <h2>Sign In to Your Account</h2>
        <p className="subtitle">
          Access specialized Ayush internships, skill assessments, and partnership directories.
        </p>

        {error && (
          <div className="auth-error-box">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Official Email Address</label>
            <input
              type="email"
              placeholder="e.g. name@ayush.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? "Authenticating..." : "Sign In to Portal"}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* 1-Click Fast Demo Logins */}
        <div className="demo-fast-actions">
          <span className="demo-fast-title">⚡ 1-Click Fast Demo Login</span>
          <div className="demo-buttons-grid">
            <button
              type="button"
              className="demo-pill student"
              onClick={() => handleQuick('student')}
              disabled={isSubmitting}
            >
              👨‍⚕️ Dr. Ananya (Student)
            </button>
            <button
              type="button"
              className="demo-pill industry"
              onClick={() => handleQuick('industry')}
              disabled={isSubmitting}
            >
              🏭 Dabur R&D (Industry)
            </button>
            <button
              type="button"
              className="demo-pill admin"
              onClick={() => handleQuick('admin')}
              disabled={isSubmitting}
            >
              🛡️ Ministry Admin
            </button>
          </div>
        </div>

        <p className="register-text">
          New to the Ayush Partnership Portal?{" "}
          <Link to="/register">Create an Account</Link>
        </p>
      </div>
    </div>
  );
}