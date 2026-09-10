import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentService, applicationService } from '../services/api';
import { 
  GraduationCap, 
  Award, 
  Briefcase, 
  Calendar, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  MapPin, 
  Building2, 
  AlertCircle,
  Target,
  MessageSquare,
  UserCheck
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [mentorship, setMentorship] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyLoading, setApplyLoading] = useState(null);
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [recs, apps, mentorData] = await Promise.all([
        studentService.getRecommendations().catch(() => []),
        applicationService.getAll().catch(() => []),
        studentService.getMentorship().catch(() => [])
      ]);
      setRecommendations(recs);
      setApplications(apps);

      if (mentorData && mentorData.length > 0) {
        const primary = mentorData[0];
        setMentorship(primary);
        const [fb, gls] = await Promise.all([
          studentService.getFeedback(primary.assignment_id).catch(() => []),
          studentService.getLearningGoals(primary.assignment_id).catch(() => [])
        ]);
        setFeedback(fb);
        setGoals(gls);
      }
    } catch (err) {
      console.error("Error loading student dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApply = async (oppId) => {
    setApplyLoading(oppId);
    setMessage('');
    try {
      const res = await applicationService.apply(oppId);
      setMessage(`Successfully applied! Check the Applications tab to track progress.`);
      setApplications(prev => [res.application, ...prev]);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplyLoading(null);
    }
  };

  const handleGoalStatusChange = async (goalId, newStatus) => {
    try {
      await studentService.updateGoalStatus(goalId, newStatus);
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, status: newStatus } : g));
    } catch (err) {
      console.error('Failed to update goal status:', err);
    }
  };

  const isApplied = (oppId) => {
    return applications.some(a => a.opportunity_id === oppId || a.opportunityId === oppId);
  };

  const upcomingInterviews = applications.filter(
    a => a.status === 'interview_scheduled' && a.interview_details
  );

  const studentSkills = user?.profile?.skills || [];

  return (
    <div className="dashboard-container">
      {/* Student Hero Banner */}
      <div className="ayush-hero-banner" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)' }}>
        <div className="hero-left">
          <div className="avatar-circle" style={{ background: '#3b82f6' }}>
            <span className="avatar-char">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </span>
          </div>
          <div className="hero-info">
            <div className="name-row">
              <h2 style={{ color: '#fff' }}>{user?.name || "Student"}</h2>
              <span className="stream-badge" style={{ background: '#dbeafe', color: '#1e40af' }}>
                {user?.profile?.degree || "Student"}
              </span>
            </div>
            <p className="academic-line" style={{ color: '#93c5fd' }}>
              <GraduationCap size={16} />
              <span>{user?.profile?.institution || "Academic Institution"} • {user?.email}</span>
            </p>
          </div>
        </div>

        <div className="hero-stats">
          <div className="hero-stat-card" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <span className="stat-num" style={{ color: '#fff' }}>{studentSkills.length}</span>
            <span className="stat-label" style={{ color: '#bfdbfe' }}>Recorded Skills</span>
          </div>
          <div className="hero-stat-card" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <span className="stat-num" style={{ color: '#fff' }}>{applications.length}</span>
            <span className="stat-label" style={{ color: '#bfdbfe' }}>Applications</span>
          </div>
          <div className="hero-stat-card" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <span className="stat-num" style={{ color: '#fff' }}>
              {applications.filter(a => ['offered', 'accepted'].includes(a.status)).length}
            </span>
            <span className="stat-label" style={{ color: '#bfdbfe' }}>Offers</span>
          </div>
        </div>
      </div>

      {message && (
        <div className="alert-box alert-success" style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: '#f0fdf4',
          color: '#166534',
          border: '1px solid #bbf7d0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={16} />
          <span>{message}</span>
        </div>
      )}

      {/* Upcoming Interviews Alert */}
      {upcomingInterviews.length > 0 && (
        <div className="interviews-panel" style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Calendar size={20} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#1e3a8a' }}>Upcoming Interviews Scheduled</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {upcomingInterviews.map(app => (
              <div key={app.id} style={{
                background: '#fff',
                padding: '14px 18px',
                borderRadius: '8px',
                border: '1px solid #dbeafe',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#0f172a' }}>{app.opportunity_title}</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    Company: <strong>{app.company_name}</strong> • Scheduled on: {app.interview_details?.date ? new Date(app.interview_details.date).toLocaleString() : 'TBD'}
                  </p>
                  {app.interview_details?.notes && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#475569' }}>Note: {app.interview_details.notes}</p>
                  )}
                </div>
                {app.interview_details?.meetingUrl && (
                  <a
                    href={app.interview_details.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ fontSize: '13px', padding: '6px 14px' }}
                  >
                    Join Meeting
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mentorship Section */}
      <div style={{ marginBottom: '28px' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={20} color="#2563eb" /> Mentorship & Career Guidance
            </h3>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '2px 0 0 0' }}>
              Guidance from your assigned academic or industry mentor.
            </p>
          </div>
        </div>

        {mentorship ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Mentor Info & Feedback */}
            <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: '#2563eb'
                }}>
                  {mentorship.mentor_name?.charAt(0) || 'M'}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>{mentorship.mentor_name}</h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {mentorship.mentor_profile?.expertise || 'Industry Mentor'} • {mentorship.mentor_email}
                  </span>
                </div>
              </div>

              <h5 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={16} color="#059669" /> Mentor Feedback
              </h5>

              {feedback.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                  No feedback received yet. Your mentor will post guidance and reviews here.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {feedback.map(fb => (
                    <div key={fb.id} style={{ padding: '10px 12px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#1e293b' }}>{fb.feedback}</p>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(fb.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Learning Goals */}
            <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Target size={16} color="#2563eb" /> Learning Goals ({goals.length})
              </h5>

              {goals.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                  No learning goals assigned yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '230px', overflowY: 'auto' }}>
                  {goals.map(g => (
                    <div key={g.id} style={{ padding: '10px 12px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{g.title}</span>
                        <select
                          value={g.status}
                          onChange={(e) => handleGoalStatusChange(g.id, e.target.value)}
                          style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      {g.description && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>{g.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
            <UserCheck size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#334155' }}>No Mentor Assigned Yet</h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
              Portal administrators pair students with verified academic and industry mentors based on your skill interests.
            </p>
          </div>
        )}
      </div>

      {/* Recommended Opportunities Section */}
      <div>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="#2563eb" /> Skill-Matched Opportunities
            </h3>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '2px 0 0 0' }}>
              Recommended based on exact compatibility between your skill profile and recruiter requirements.
            </p>
          </div>
          <Link to="/opportunities" className="btn btn-outline btn-sm" style={{ fontSize: '13px' }}>
            Browse All ({recommendations.length}) <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading recommendations...</div>
        ) : recommendations.length === 0 ? (
          <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '36px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
            <Briefcase size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <h4>No Active Opportunities Yet</h4>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>Check back soon as approved industry recruiters publish new internship and job openings.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {recommendations.slice(0, 6).map(opp => {
              const applied = isApplied(opp.id);
              const score = opp.matchScore;
              return (
                <div key={opp.id} className="card" style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span className="type-badge" style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#eff6ff', color: '#2563eb', fontWeight: 600 }}>
                        {opp.type}
                      </span>
                      {score !== null && score !== undefined ? (
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          backgroundColor: score >= 75 ? '#dcfce7' : score >= 50 ? '#fef3c7' : '#fee2e2',
                          color: score >= 75 ? '#15803d' : score >= 50 ? '#b45309' : '#b91c1c'
                        }}>
                          {score}% Skill Match
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Skills not specified</span>
                      )}
                    </div>

                    <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a' }}>
                      {opp.title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', marginBottom: '12px' }}>
                      <Building2 size={14} /> <span>{opp.company_name}</span> • <MapPin size={14} /> <span>{opp.location}</span>
                    </div>

                    {/* Skill matching chips */}
                    {opp.matchingSkills && opp.matchingSkills.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#166534', display: 'block', marginBottom: '3px' }}>Matching:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {opp.matchingSkills.map((s, idx) => (
                            <span key={idx} style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                              ✓ {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {opp.missingSkills && opp.missingSkills.length > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#b45309', display: 'block', marginBottom: '3px' }}>Skills to acquire:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {opp.missingSkills.map((s, idx) => (
                            <span key={idx} style={{ background: '#fef3c7', color: '#92400e', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>
                              + {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                      {opp.stipend || 'Competitive'}
                    </span>
                    <button
                      onClick={() => handleApply(opp.id)}
                      disabled={applied || applyLoading === opp.id}
                      className={applied ? "btn btn-outline btn-sm" : "btn btn-primary btn-sm"}
                      style={{ fontSize: '12px', padding: '5px 12px' }}
                    >
                      {applied ? '✓ Applied' : applyLoading === opp.id ? 'Applying...' : 'Apply Now'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
