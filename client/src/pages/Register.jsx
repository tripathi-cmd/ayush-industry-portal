import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GraduationCap, Building2, AlertCircle, ArrowRight } from "lucide-react";
import "./login.css";

export default function Register() {
  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stream, setStream] = useState("ayurveda");
  const [degree, setDegree] = useState("BAMS");
  const [institution, setInstitution] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
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
        name: role === 'student' ? name : companyName,
        stream,
        degree,
        institution,
        companyName,
        ayushSector: stream,
        licenseNumber
      };

      const user = await register(payload);
      if (user.role === "student") navigate("/student");
      else if (user.role === "industry") navigate("/industry");
      else navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please check your information.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card register-card">
        {/* Ministry Badge */}
        <div className="logo-section">
          <div className="emblem-container">
            <span className="emblem-leaf">🌿</span>
          </div>
          <h1>Ministry of Ayush</h1>
          <p className="portal-tagline">National Partnership & Talent Registration</p>
          <div className="gold-accent-line"></div>
        </div>

        {/* Role Toggle */}
        <div className="role-tabs">
          <button
            type="button"
            className={`role-tab ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
          >
            <GraduationCap size={16} />
            <span>Student / Candidate</span>
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'industry' ? 'active' : ''}`}
            onClick={() => setRole('industry')}
          >
            <Building2 size={16} />
            <span>Industry / Hospital</span>
          </button>
        </div>

        <h2>Create Your Portal Profile</h2>
        <p className="subtitle">
          {role === 'student' 
            ? 'Connect with Ministry-accredited Ayush hospitals, pharmaceutical R&D, and clinical research centres.'
            : 'Register your Ayush hospital, formulation lab, or manufacturing unit to hire verified talent.'
          }
        </p>

        {error && (
          <div className="auth-error-box">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {role === 'student' ? (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name (with Dr./Title if applicable)</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Rajesh Verma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Official / Personal Email</label>
                  <input
                    type="email"
                    placeholder="rajesh@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ayush Discipline / Specialization</label>
                  <select value={stream} onChange={(e) => setStream(e.target.value)}>
                    <option value="ayurveda">Ayurveda (BAMS / MD)</option>
                    <option value="yoga_naturopathy">Yoga & Naturopathy (BNYS / ND)</option>
                    <option value="unani">Unani Medicine (BUMS / MD)</option>
                    <option value="siddha">Siddha Medicine (BSMS / MD)</option>
                    <option value="homeopathy">Homeopathy (BHMS / MD)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Current Degree Status</label>
                  <input
                    type="text"
                    placeholder="e.g. BAMS Final Year / Intern"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>University / College / Institute</label>
                <input
                  type="text"
                  placeholder="e.g. National Institute of Ayurveda, Jaipur"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Company / Hospital / Institute Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Patanjali Research Foundation"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Corporate / Official Email</label>
                  <input
                    type="email"
                    placeholder="hr@patanjali.res.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Primary Ayush Sector</label>
                  <select value={stream} onChange={(e) => setStream(e.target.value)}>
                    <option value="ayurveda">Ayurveda Drug Manufacturing & Clinical</option>
                    <option value="yoga_naturopathy">Yoga Therapy & Wellness Centres</option>
                    <option value="unani">Unani Formulations & Hospital</option>
                    <option value="siddha">Siddha Pharmacology & Healthcare</option>
                    <option value="homeopathy">Homeopathic Clinical Care</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>AYUSH Drug License / Registration No.</label>
                  <input
                    type="text"
                    placeholder="e.g. AYUSH-DL-2024-8841"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Secure Password</label>
            <input
              type="password"
              placeholder="Create a strong password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? "Creating Profile..." : "Register Account"}
            <ArrowRight size={18} />
          </button>
        </form>

        <p className="register-text">
          Already have an Ayush portal account?{" "}
          <Link to="/login">Sign In here</Link>
        </p>
      </div>
    </div>
  );
}
