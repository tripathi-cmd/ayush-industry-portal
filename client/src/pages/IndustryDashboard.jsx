import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { opportunityService, applicationService } from '../services/api';
import { 
  Building2, 
  Briefcase, 
  Users, 
  CheckCircle, 
  Plus, 
  Sparkles, 
  Video, 
  ShieldCheck, 
  X 
} from 'lucide-react';

export default function IndustryDashboard() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedAppForInterview, setSelectedAppForInterview] = useState(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewerName, setInterviewerName] = useState(user?.name || 'Head of Talent');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [alertMsg, setAlertMsg] = useState('');

  // New posting form state
  const [formData, setFormData] = useState({
    title: '',
    stream: 'ayurveda',
    type: 'Internship (Clinical)',
    location: 'On-site',
    stipend: '₹22,000 / month',
    duration: '6 Months',
    openings: 3,
    requiredSkills: '',
    description: '',
    eligibility: 'BAMS / Ayush Graduates'
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [opps, apps] = await Promise.all([
        opportunityService.getAll({}),
        applicationService.getAll()
      ]);
      // Filter opportunities posted by this industry partner
      const myOpps = opps.filter(o => o.postedBy === user?.id || o.companyName === user?.companyName);
      setOpportunities(myOpps);
      setApplications(apps);
    } catch (err) {
      console.error("Error loading industry data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      await opportunityService.create({
        ...formData,
        requiredSkills: skillsArray
      });
      setAlertMsg("New Ayush internship position posted successfully!");
      setShowPostModal(false);
      setFormData({
        title: '',
        stream: 'ayurveda',
        type: 'Internship (Clinical)',
        location: 'On-site',
        stipend: '₹22,000 / month',
        duration: '6 Months',
        openings: 3,
        requiredSkills: '',
        description: '',
        eligibility: 'BAMS / Ayush Graduates'
      });
      loadData();
    } catch (err) {
      setAlertMsg(err.response?.data?.message || "Failed to post opportunity");
    }
  };

  const handleUpdateAppStatus = async (appId, newStatus) => {
    try {
      await applicationService.updateStatus(appId, { status: newStatus });
      setAlertMsg(`Candidate status updated to: ${newStatus.replace('_', ' ').toUpperCase()}`);
      loadData();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleScheduleInterviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppForInterview) return;

    try {
      const roomSlug = `Ayush-${user?.companyName?.replace(/[^a-zA-Z0-9]/g, '') || 'Partner'}-${Date.now()}`;
      const meetingLink = `https://meet.jit.si/${roomSlug}`;

      await applicationService.updateStatus(selectedAppForInterview.id, {
        status: 'interview_scheduled',
        interviewDetails: {
          dateTime: interviewDate || new Date().toISOString(),
          interviewer: interviewerName,
          meetingLink,
          notes: interviewNotes || "Please be ready with your academic transcripts and clinical case portfolio."
        }
      });

      setAlertMsg(`Interview scheduled with ${selectedAppForInterview.studentName}! Secure video link generated.`);
      setSelectedAppForInterview(null);
      setInterviewDate('');
      setInterviewNotes('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Industry Partner Header */}
      <div className="ayush-hero-banner industry">
        <div className="hero-left">
          <div className="avatar-circle industry-avatar">
            <Building2 size={32} />
          </div>
          <div className="hero-info">
            <div className="name-row">
              <h2>{user?.companyName || user?.name || "Ayush Corporate Partner"}</h2>
              <span className="verified-pill">
                <ShieldCheck size={14} /> Ministry Accredited Partner
              </span>
            </div>
            <p className="academic-line">
              <span>Ayush Sector: <strong>{user?.ayushSector?.toUpperCase() || 'AYURVEDA'}</strong></span>
              <span className="divider">|</span>
              <span>License: <strong>{user?.licenseNumber || 'AYUSH-GMP-2024-VALID'}</strong></span>
            </p>
          </div>
        </div>

        <div className="hero-right">
          <button onClick={() => setShowPostModal(true)} className="btn btn-primary">
            <Plus size={16} /> Post New Ayush Internship
          </button>
        </div>
      </div>

      {alertMsg && (
        <div className="action-alert-box">
          <CheckCircle size={18} />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box green">
            <Briefcase size={22} />
          </div>
          <div className="metric-content">
            <span className="metric-val">{opportunities.length}</span>
            <span className="metric-label">Active Postings</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box amber">
            <Users size={22} />
          </div>
          <div className="metric-content">
            <span className="metric-val">{applications.length}</span>
            <span className="metric-label">Candidate Applicants</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box teal">
            <Sparkles size={22} />
          </div>
          <div className="metric-content">
            <span className="metric-val">
              {applications.filter(a => a.status === 'shortlisted').length}
            </span>
            <span className="metric-label">Shortlisted Talents</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box gold">
            <Video size={22} />
          </div>
          <div className="metric-content">
            <span className="metric-val">
              {applications.filter(a => a.status === 'interview_scheduled').length}
            </span>
            <span className="metric-label">Scheduled Interviews</span>
          </div>
        </div>
      </div>

      {/* Candidate Applicants Table */}
      <div className="content-card">
        <div className="card-header">
          <div className="card-title-icon">
            <Users size={20} className="green-icon" />
            <h3>Candidate Applicants & AI Skill Match Analysis</h3>
          </div>
          <span className="info-tag">{applications.length} Received Applications</span>
        </div>

        {applications.length === 0 ? (
          <p className="empty-text">No applicants yet. Once students apply, their AI skill match analysis will appear here.</p>
        ) : (
          <div className="table-wrapper">
            <table className="ayush-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Applied Position</th>
                  <th>AI Match Score</th>
                  <th>Matching Skills</th>
                  <th>Status</th>
                  <th>Recruitment Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id}>
                    <td>
                      <div className="candidate-cell">
                        <strong>{app.studentName}</strong>
                        <span>{app.studentDegree}</span>
                        <span className="sub-cell">{app.studentEmail}</span>
                      </div>
                    </td>
                    <td>
                      <strong>{app.opportunityTitle}</strong>
                      <span className="sub-cell">Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                    </td>
                    <td>
                      <div className={`match-badge ${app.matchScore >= 80 ? 'high' : 'medium'}`}>
                        <Sparkles size={13} />
                        <span>{app.matchScore}% Match</span>
                      </div>
                    </td>
                    <td>
                      <div className="skills-cell-tags">
                        {(app.matchingSkills || []).map((sk, i) => (
                          <span key={i} className="skill-pill-sm match">{sk}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${app.status}`}>
                        {app.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-cell">
                        {app.status === 'applied' && (
                          <button
                            onClick={() => handleUpdateAppStatus(app.id, 'shortlisted')}
                            className="btn btn-secondary btn-xs"
                          >
                            Shortlist
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedAppForInterview(app)}
                          className="btn btn-outline btn-xs"
                        >
                          <Video size={13} /> Schedule Interview
                        </button>

                        {app.status !== 'offered' && (
                          <button
                            onClick={() => handleUpdateAppStatus(app.id, 'offered')}
                            className="btn btn-primary btn-xs"
                          >
                            Offer Position
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Postings Summary */}
      <div className="content-card">
        <div className="card-header">
          <div className="card-title-icon">
            <Briefcase size={20} className="green-icon" />
            <h3>Your Active Ayush Listings</h3>
          </div>
          <button onClick={() => setShowPostModal(true)} className="btn btn-outline btn-sm">
            <Plus size={14} /> Add Listing
          </button>
        </div>

        <div className="postings-grid">
          {opportunities.map(opp => (
            <div key={opp.id} className="posting-mini-card">
              <div className="posting-mini-top">
                <span className="opp-stream-pill">{opp.stream.toUpperCase()}</span>
                <span className={`status-badge ${opp.status}`}>
                  {opp.status.toUpperCase()}
                </span>
              </div>
              <h4>{opp.title}</h4>
              <p className="posting-meta">
                <span>{opp.type}</span> • <span>{opp.stipend}</span> • <span>{opp.location}</span>
              </p>
              <div className="skills-wrap">
                {(opp.requiredSkills || []).map((s, idx) => (
                  <span key={idx} className="skill-pill-sm">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Post Internship Modal */}
      {showPostModal && (
        <div className="modal-overlay" onClick={() => setShowPostModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Post New Ayush Internship / Placement</h3>
              <button onClick={() => setShowPostModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePostSubmit} className="modal-form">
              <div className="form-group">
                <label>Position Title</label>
                <input
                  type="text"
                  placeholder="e.g. Clinical Research Fellow in Dravyaguna"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ayush Discipline</label>
                  <select
                    value={formData.stream}
                    onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                  >
                    <option value="ayurveda">Ayurveda</option>
                    <option value="yoga_naturopathy">Yoga & Naturopathy</option>
                    <option value="unani">Unani Medicine</option>
                    <option value="siddha">Siddha Medicine</option>
                    <option value="homeopathy">Homeopathy</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Engagement Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Internship (Clinical)">Internship (Clinical Hospital)</option>
                    <option value="Research Fellowship">Research Fellowship (R&D Lab)</option>
                    <option value="Placement / PPO">Full-Time Placement / PPO</option>
                    <option value="Manufacturing / QC">Manufacturing & QC (GMP)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Delhi NCR / Haridwar / On-site"
                  />
                </div>
                <div className="form-group">
                  <label>Monthly Stipend / Compensation</label>
                  <input
                    type="text"
                    value={formData.stipend}
                    onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
                    placeholder="e.g. ₹25,000 / month"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g. 6 Months"
                  />
                </div>
                <div className="form-group">
                  <label>Number of Openings</label>
                  <input
                    type="number"
                    value={formData.openings}
                    onChange={(e) => setFormData({ ...formData, openings: e.target.value })}
                    min={1}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Required Ayush Skills (comma separated for AI matching)</label>
                <input
                  type="text"
                  placeholder="e.g. Panchakarma Procedures, Dravyaguna (Pharmacognosy), Nadi Pariksha"
                  value={formData.requiredSkills}
                  onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Job Description & Responsibilities</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe patient exposure, lab instrumentation, research scope..."
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowPostModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Internship
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {selectedAppForInterview && (
        <div className="modal-overlay" onClick={() => setSelectedAppForInterview(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Schedule Video Interview</h3>
              <button onClick={() => setSelectedAppForInterview(null)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleScheduleInterviewSubmit} className="modal-form">
              <p className="modal-subtext">
                Candidate: <strong>{selectedAppForInterview.studentName}</strong> ({selectedAppForInterview.studentDegree})
                <br />
                Position: <strong>{selectedAppForInterview.opportunityTitle}</strong>
              </p>

              <div className="form-group">
                <label>Interview Date & Time</label>
                <input
                  type="datetime-local"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Interviewer Name / Designation</label>
                <input
                  type="text"
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  placeholder="e.g. Dr. Singhania, Head of Clinical Research"
                  required
                />
              </div>

              <div className="form-group">
                <label>Preparation Notes for Candidate</label>
                <textarea
                  rows={3}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="e.g. Please bring your thesis summary and clinical case log book."
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setSelectedAppForInterview(null)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Video size={16} /> Confirm & Generate Video Call Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
