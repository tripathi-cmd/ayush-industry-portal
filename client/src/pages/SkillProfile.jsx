import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentService, getTaxonomy } from '../services/api';
import { 
  Award, 
  BookOpen, 
  FileCheck, 
  Upload, 
  Plus, 
  X, 
  CheckCircle, 
  Sparkles, 
  ShieldCheck, 
  Save 
} from 'lucide-react';

export default function SkillProfile() {
  const { user, updateUser } = useAuth();
  const [skills, setSkills] = useState(user?.skills || []);
  const [customSkill, setCustomSkill] = useState('');
  const [bio, setBio] = useState(user?.bio || '');
  const [degree, setDegree] = useState(user?.degree || '');
  const [institution, setInstitution] = useState(user?.institution || '');
  const [location, setLocation] = useState(user?.location || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [stream, setStream] = useState(user?.stream || 'ayurveda');
  const [taxonomy, setTaxonomy] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('Degree Certificate');
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    async function fetchTax() {
      try {
        const tax = await getTaxonomy();
        setTaxonomy(tax);
      } catch (err) {
        console.error(err);
      }
    }
    fetchTax();
  }, []);

  const handleAddSkill = (skillToAdd) => {
    const trimmed = skillToAdd.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills(prev => [...prev, trimmed]);
    }
    setCustomSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      const res = await studentService.updateProfile({
        skills,
        bio,
        degree,
        institution,
        location,
        phone,
        stream
      });
      updateUser(res.user);
      setMessage('Ayush Skill Profile successfully updated and synced with recruiter matching engine!');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!docTitle) return;
    setUploadLoading(true);
    try {
      const res = await studentService.uploadDocument({ title: docTitle, type: docType });
      const currentDocs = user?.documents || [];
      updateUser({ documents: [...currentDocs, res.document] });
      setDocTitle('');
      setMessage('Academic certificate registered and verified by Ministry portal verification system!');
    } catch {
      setMessage('Failed to register document');
    } finally {
      setUploadLoading(false);
    }
  };

  const domainSkills = taxonomy && taxonomy[stream]?.coreSkills ? taxonomy[stream].coreSkills : [
    "Panchakarma Procedures",
    "Nadi Pariksha (Pulse Diagnosis)",
    "Dravyaguna (Pharmacognosy)",
    "Rasa Shastra & Bhaishajya Kalpana",
    "Charaka Samhita Protocols",
    "Ayurvedic Dietetics (Pathya-Apathya)",
    "Clinical Case Documentation",
    "Classical Herb Identification"
  ];

  const suggestedSkills = domainSkills.filter(s => !skills.includes(s));

  return (
    <div className="dashboard-container">
      <div className="page-header-row">
        <div>
          <h2>Ayush Skill Profile & Competency Matrix</h2>
          <p className="page-subtitle">
            Manage your verified competencies, clinical specializations, and Ministry-verified credentials.
          </p>
        </div>
        <button onClick={handleSaveProfile} className="btn btn-primary" disabled={isSaving}>
          <Save size={16} /> {isSaving ? 'Saving Changes...' : 'Save Profile'}
        </button>
      </div>

      {message && (
        <div className="action-alert-box">
          <CheckCircle size={18} />
          <span>{message}</span>
        </div>
      )}

      <div className="two-column-layout">
        {/* Left Column: Skills & Taxonomy */}
        <div className="main-column">
          {/* Active Skills Box */}
          <div className="content-card">
            <div className="card-header">
              <div className="card-title-icon">
                <Award size={20} className="green-icon" />
                <h3>Your Active Ayush Skills ({skills.length})</h3>
              </div>
              <span className="info-tag">Used for AI Internship Matching</span>
            </div>

            <div className="active-skills-container">
              {skills.length === 0 ? (
                <p className="empty-text">No skills added yet. Select from the recommended list below or add custom skills.</p>
              ) : (
                skills.map((sk, index) => (
                  <span key={index} className="skill-chip">
                    <span>{sk}</span>
                    <button type="button" onClick={() => handleRemoveSkill(sk)} aria-label="Remove skill">
                      <X size={14} />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add Custom Skill Input */}
            <div className="add-skill-bar">
              <input
                type="text"
                placeholder="Enter custom clinical or laboratory skill..."
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill(customSkill);
                  }
                }}
              />
              <button 
                type="button" 
                onClick={() => handleAddSkill(customSkill)}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={16} /> Add Skill
              </button>
            </div>
          </div>

          {/* Suggested Domain Skills */}
          <div className="content-card">
            <div className="card-header">
              <div className="card-title-icon">
                <Sparkles size={20} className="gold-icon" />
                <h3>Recommended Competencies for {taxonomy?.[stream]?.name || "Your Discipline"}</h3>
              </div>
            </div>
            <p className="card-subtext">
              Click any skill below to add it directly to your profile. These skills are frequently demanded by Ayush pharmaceutical and hospital recruiters.
            </p>

            <div className="suggested-skills-grid">
              {suggestedSkills.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAddSkill(s)}
                  className="suggested-skill-btn"
                >
                  <Plus size={14} />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Academic & Bio Details */}
          <div className="content-card">
            <div className="card-header">
              <div className="card-title-icon">
                <BookOpen size={20} className="green-icon" />
                <h3>Academic Background & Clinical Focus</h3>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Ayush Discipline</label>
                  <select value={stream} onChange={(e) => setStream(e.target.value)}>
                    <option value="ayurveda">Ayurveda</option>
                    <option value="yoga_naturopathy">Yoga & Naturopathy</option>
                    <option value="unani">Unani Medicine</option>
                    <option value="siddha">Siddha Medicine</option>
                    <option value="homeopathy">Homeopathy</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Degree / Academic Stage</label>
                  <input
                    type="text"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    placeholder="e.g. BAMS Final Year / MD Ayurveda"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Institute / University</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="College or University name"
                  />
                </div>
                <div className="form-group">
                  <label>Location / City</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Jaipur, Rajasthan"
                  />
                </div>
                <div className="form-group">
                  <label>Phone / Contact</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Professional Bio / Clinical Interests</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Summarize your hands-on experience, laboratory trainings, dissertation topic, and preferred career path in the Ayush ecosystem..."
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                <Save size={16} /> Save Profile Details
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Verified Documents & Assessments */}
        <div className="side-column">
          {/* Documents Box */}
          <div className="content-card">
            <div className="card-header">
              <div className="card-title-icon">
                <FileCheck size={20} className="green-icon" />
                <h4>Verified Documents</h4>
              </div>
            </div>

            <div className="doc-list">
              {(user?.documents || []).length === 0 ? (
                <p className="empty-text">No documents registered.</p>
              ) : (
                user.documents.map((doc) => (
                  <div key={doc.id} className="doc-card">
                    <div className="doc-info">
                      <span className="doc-title">{doc.title}</span>
                      <span className="doc-meta">{doc.type} • Verified on {doc.verifiedAt}</span>
                    </div>
                    <span className="doc-verified-badge">
                      <ShieldCheck size={14} /> Verified
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Add Document Form */}
            <form onSubmit={handleUploadDoc} className="upload-doc-form">
              <h5>Register New Document</h5>
              <div className="form-group">
                <label>Certificate / Degree Title</label>
                <input
                  type="text"
                  placeholder="e.g. BAMS State Council Registration"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Document Type</label>
                <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                  <option value="Academic Certificate">Academic Certificate / Degree</option>
                  <option value="Council Registration">State Council Registration</option>
                  <option value="Internship Completion">Internship Completion Letter</option>
                  <option value="Specialized Training">Panchakarma / Clinical Certificate</option>
                </select>
              </div>
              <button type="submit" className="btn btn-secondary btn-sm" disabled={uploadLoading}>
                <Upload size={14} /> {uploadLoading ? "Registering..." : "Upload & Verify"}
              </button>
            </form>
          </div>

          {/* Assessment Badges Box */}
          <div className="content-card">
            <div className="card-header">
              <div className="card-title-icon">
                <Award size={20} className="gold-icon" />
                <h4>Earned Badges</h4>
              </div>
            </div>

            {(user?.assessmentScores || []).length === 0 ? (
              <div className="empty-card-prompt">
                <p>No assessment badges earned yet.</p>
                <a href="/assessment" className="btn btn-outline btn-xs">Take an Assessment</a>
              </div>
            ) : (
              <div className="badge-list">
                {user.assessmentScores.map((score, i) => (
                  <div key={i} className="earned-badge-card">
                    <div className="badge-gold-icon">🏆</div>
                    <div className="badge-text">
                      <strong>{score.badge || score.title}</strong>
                      <span>Score: {score.score}% • Passed</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
