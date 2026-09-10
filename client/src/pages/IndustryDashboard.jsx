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
  Calendar, 
  AlertTriangle, 
  X,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function IndustryDashboard() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedAppForInterview, setSelectedAppForInterview] = useState(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [alertMsg, setAlertMsg] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('applicants');

  const isPending = user?.approval === 'pending';

  // New posting form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'Internship',
    location: 'Remote',
    stipend: '₹25,000 / month',
    duration: '3 Months',
    openings: 2,
    requiredSkills: '',
    description: '',
    eligibility: 'Open to enrolled students & recent graduates'
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [opps, apps] = await Promise.all([
        opportunityService.getAll({}),
        applicationService.getAll()
      ]);
      // Opportunities posted by this recruiter
      const myOpps = opps.filter(o => o.posted_by === user?.id || o.postedBy === user?.id);
      setOpportunities(myOpps);
      setApplications(apps);
    } catch (err) {
      console.error("Error loading recruiter data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setAlertMsg({ text: '', type: '' });
    try {
      const skillsArray = formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      await opportunityService.create({
        ...formData,
        requiredSkills: skillsArray
      });
      setAlertMsg({
        text: "Opportunity submitted successfully. It will be live once reviewed by an administrator.",
        type: 'success'
      });
      setShowPostModal(false);
      setFormData({
        title: '',
        type: 'Internship',
        location: 'Remote',
        stipend: '₹25,000 / month',
        duration: '3 Months',
        openings: 2,
        requiredSkills: '',
        description: '',
        eligibility: 'Open to enrolled students & recent graduates'
      });
      loadData();
    } catch (err) {
      setAlertMsg({ text: err.response?.data?.message || "Failed to post opportunity", type: 'error' });
    }
  };

  const handleUpdateAppStatus = async (appId, newStatus, interviewDetails = null) => {
    setAlertMsg({ text: '', type: '' });
    try {
      await applicationService.updateStatus(appId, {
        status: newStatus,
        interviewDetails
      });
      setAlertMsg({ text: `Application status updated to: ${newStatus.replace('_', ' ')}`, type: 'success' });
      setSelectedAppForInterview(null);
      loadData();
    } catch (err) {
      setAlertMsg({ text: err.response?.data?.message || "Failed to update application status", type: 'error' });
    }
  };

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    if (!selectedAppForInterview) return;
    handleUpdateAppStatus(selectedAppForInterview.id, 'interview_scheduled', {
      date: interviewDate,
      meetingUrl,
      notes: interviewNotes
    });
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h2>Industry Recruiter Portal</h2>
          <p className="page-subtitle">
            Manage your company profile, publish verified internships & job openings, and review candidate skill matches.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span className={`status-badge ${isPending ? 'status-review' : 'status-accepted'}`} style={{ fontSize: '13px', padding: '6px 14px' }}>
            {isPending ? 'Pending Admin Approval' : 'Verified Recruiter'}
          </span>
          <button
            onClick={() => setShowPostModal(true)}
            disabled={isPending}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <Plus size={16} /> Post Opportunity
          </button>
        </div>
      </div>

      {/* Pending Banner */}
      {isPending && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fef3c7',
          borderRadius: '12px',
          padding: '18px 20px',
          marginBottom: '24px',
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-start'
        }}>
          <AlertTriangle size={22} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ color: '#92400e', margin: '0 0 4px 0', fontSize: '15px' }}>Account Awaiting Verification</h4>
            <p style={{ color: '#b45309', margin: 0, fontSize: '13px', lineHeight: '1.5' }}>
              Your recruiter account is pending administrator verification. While pending, you cannot publish live postings.
              Administrators review new partner accounts promptly.
            </p>
          </div>
        </div>
      )}

      {/* Alert Messages */}
      {alertMsg.text && (
        <div className={`alert-box ${alertMsg.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: alertMsg.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: alertMsg.type === 'error' ? '#991b1b' : '#166534',
          border: `1px solid ${alertMsg.type === 'error' ? '#fecaca' : '#bbf7d0'}`
        }}>
          {alertMsg.text}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '18px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Active Postings</span>
          <h3 style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0 0 0', color: '#0f172a' }}>
            {opportunities.filter(o => o.status === 'approved').length}
          </h3>
        </div>
        <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '18px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total Applicants</span>
          <h3 style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0 0 0', color: '#2563eb' }}>
            {applications.length}
          </h3>
        </div>
        <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '18px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Interviews Scheduled</span>
          <h3 style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0 0 0', color: '#059669' }}>
            {applications.filter(a => a.status === 'interview_scheduled').length}
          </h3>
        </div>
        <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '18px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Offers Extended</span>
          <h3 style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0 0 0', color: '#7c3aed' }}>
            {applications.filter(a => ['offered', 'accepted'].includes(a.status)).length}
          </h3>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('applicants')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'applicants' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'applicants' ? '#2563eb' : '#64748b',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Applicants ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('postings')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'postings' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'postings' ? '#2563eb' : '#64748b',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          My Postings ({opportunities.length})
        </button>
      </div>

      {/* TAB 1: Applicants Review */}
      {activeTab === 'applicants' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading applicants...</div>
          ) : applications.length === 0 ? (
            <div className="card" style={{ background: '#fff', padding: '40px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
              <Users size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <h4>No Applications Received Yet</h4>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                When students apply for your published postings, their profiles and skill matches will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {applications.map(app => {
                const snap = app.match_snapshot || {};
                const score = snap.matchScore;
                return (
                  <div
                    key={app.id}
                    className="card"
                    style={{
                      background: '#fff',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>{app.student_name}</h4>
                        <span className={`status-badge status-${app.status}`} style={{ fontSize: '11px' }}>
                          {app.status.replace(/_/g, ' ')}
                        </span>
                        {score !== null && score !== undefined && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: score >= 75 ? '#dcfce7' : score >= 50 ? '#fef3c7' : '#fee2e2',
                            color: score >= 75 ? '#15803d' : score >= 50 ? '#b45309' : '#b91c1c'
                          }}>
                            {score}% Compatibility
                          </span>
                        )}
                      </div>

                      <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#64748b' }}>
                        Applying for: <strong>{app.opportunity_title}</strong> • {app.student_email}
                      </p>

                      {/* Matching Skills */}
                      {snap.matchingSkills && snap.matchingSkills.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>Matched:</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {snap.matchingSkills.map((sk, idx) => (
                              <span key={idx} style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', padding: '1px 6px', borderRadius: '4px' }}>
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                      {app.status === 'applied' && (
                        <button
                          onClick={() => handleUpdateAppStatus(app.id, 'shortlisted')}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '12px' }}
                        >
                          Shortlist
                        </button>
                      )}

                      {['applied', 'shortlisted'].includes(app.status) && (
                        <button
                          onClick={() => setSelectedAppForInterview(app)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Calendar size={12} /> Schedule Interview
                        </button>
                      )}

                      {app.status === 'interview_scheduled' && (
                        <button
                          onClick={() => handleUpdateAppStatus(app.id, 'offered')}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '12px', background: '#059669', borderColor: '#059669' }}
                        >
                          Make Offer
                        </button>
                      )}

                      {app.status !== 'rejected' && app.status !== 'accepted' && (
                        <button
                          onClick={() => handleUpdateAppStatus(app.id, 'rejected')}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '12px', color: '#dc2626', borderColor: '#fecaca' }}
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: My Postings */}
      {activeTab === 'postings' && (
        <div>
          {opportunities.length === 0 ? (
            <div className="card" style={{ background: '#fff', padding: '40px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
              <Briefcase size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <h4>No Opportunities Posted Yet</h4>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                Click the "Post Opportunity" button above to publish an internship or job opening.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {opportunities.map(opp => (
                <div
                  key={opp.id}
                  className="card"
                  style={{
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className={`status-badge ${opp.status === 'approved' ? 'status-accepted' : 'status-review'}`} style={{ fontSize: '11px' }}>
                        {opp.status === 'approved' ? 'Live on Portal' : 'Pending Review'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{opp.type} • {opp.location}</span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>{opp.title}</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                      {opp.stipend} • {opp.duration} • {opp.openings} openings
                    </p>
                  </div>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Created: {new Date(opp.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Post Opportunity Modal */}
      {showPostModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '28px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Post New Opportunity</h3>
              <button onClick={() => setShowPostModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#94a3b8" />
              </button>
            </div>

            <form onSubmit={handlePostSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Opportunity Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full-Stack Engineering Intern, Data Analyst"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Opportunity Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value="Internship">Internship</option>
                    <option value="Full-time">Full-time Job</option>
                    <option value="Apprenticeship">Apprenticeship</option>
                    <option value="Project">Live Project</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru / Remote"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Stipend / Salary</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹25,000 / mo"
                    value={formData.stipend}
                    onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 3 Months"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Openings</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.openings}
                    onChange={(e) => setFormData({ ...formData, openings: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Required Skills (comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. React, Node.js, PostgreSQL, Git"
                  value={formData.requiredSkills}
                  onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Job Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe day-to-day responsibilities, learning outcomes, and expectations..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Eligibility Criteria</label>
                <input
                  type="text"
                  placeholder="e.g. Pre-final or final year B.Tech / BCA students"
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowPostModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {selectedAppForInterview && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px' }}>Schedule Interview</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
              Candidate: <strong>{selectedAppForInterview.student_name}</strong> ({selectedAppForInterview.opportunity_title})
            </p>

            <form onSubmit={handleScheduleSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Meeting URL (Google Meet / Zoom / Teams)
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xyz-abcd-efg"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Notes for Candidate</label>
                <textarea
                  rows={2}
                  placeholder="Any preparations needed, coding environment, or technical agenda..."
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setSelectedAppForInterview(null)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
