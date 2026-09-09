import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentService, applicationService } from '../services/api';
import { 
  GraduationCap, 
  Award, 
  Briefcase, 
  Calendar, 
  Video, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  MapPin, 
  Building2, 
  AlertCircle 
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyLoading, setApplyLoading] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [recs, apps] = await Promise.all([
          studentService.getRecommendations(),
          applicationService.getAll()
        ]);
        setRecommendations(recs);
        setApplications(apps);
      } catch (err) {
        console.error("Error loading student dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleApply = async (oppId) => {
    setApplyLoading(oppId);
    setMessage('');
    try {
      const res = await applicationService.apply(oppId);
      setMessage(`Successfully applied for position!`);
      // Update applications list
      setApplications(prev => [res.application, ...prev]);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplyLoading(null);
    }
  };

  const isApplied = (oppId) => {
    return applications.some(a => a.opportunityId === oppId);
  };

  const upcomingInterviews = applications.filter(
    a => a.status === 'interview_scheduled' && a.interviewDetails
  );

  const formatStream = (st) => {
    const map = {
      ayurveda: "Ayurveda",
      yoga_naturopathy: "Yoga & Naturopathy",
      unani: "Unani Medicine",
      siddha: "Siddha Medicine",
      homeopathy: "Homeopathy"
    };
    return map[st] || st || "Ayush Discipline";
  };

  return (
    <div className="dashboard-container">
      {/* Student Profile Hero Card */}
      <div className="ayush-hero-banner">
        <div className="hero-left">
          <div className="avatar-circle">
            <span className="avatar-char">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </span>
          </div>
          <div className="hero-info">
            <div className="name-row">
              <h2>{user?.name || "Dr. Ayush Candidate"}</h2>
              <span className="stream-badge">{formatStream(user?.stream)}</span>
              <span className="verified-pill">
                <CheckCircle size={14} /> Ministry Registered
              </span>
            </div>
            <p className="academic-line">
              <GraduationCap size={16} />
              <span>{user?.degree || "BAMS Final Year"} • {user?.institution || "National Institute of Ayurveda"}</span>
            </p>
            <p className="location-line">
              <MapPin size={14} /> {user?.location || "Jaipur, Rajasthan"}
            </p>
          </div>
        </div>

        <div className="hero-right">
          <Link to="/skills" className="btn btn-secondary">
            <Award size={16} /> Manage Skills & Docs
          </Link>
          <Link to="/assessment" className="btn btn-primary">
            <Sparkles size={16} /> Take Skill Assessment
          </Link>
        </div>
      </div>

      {/* Alert message */}
      {message && (
        <div className="action-alert-box">
          <AlertCircle size={18} />
          <span>{message}</span>
        </div>
      )}

      {/* Dashboard Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box green">
            <Briefcase size={22} />
          </div>
          <div className="metric-content">
            <span className="metric-val">{applications.length}</span>
            <span className="metric-label">Applications Sent</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box amber">
            <Calendar size={22} />
          </div>
          <div className="metric-content">
            <span className="metric-val">{upcomingInterviews.length}</span>
            <span className="metric-label">Interviews Scheduled</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box teal">
            <Award size={22} />
          </div>
          <div className="metric-content">
            <span className="metric-val">{(user?.skills || []).length}</span>
            <span className="metric-label">Verified Ayush Skills</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box gold">
            <Sparkles size={22} />
          </div>
          <div className="metric-content">
            <span className="metric-val">
              {user?.assessmentScores?.length ? `${user.assessmentScores[0].score}%` : '88%'}
            </span>
            <span className="metric-label">Clinical Competency Score</span>
          </div>
        </div>
      </div>

      {/* Scheduled Interviews Alert Banner */}
      {upcomingInterviews.length > 0 && (
        <div className="interview-alert-card">
          <div className="interview-badge">
            <Video size={18} />
            <span>Upcoming Industry Interview</span>
          </div>
          <div className="interview-body">
            {upcomingInterviews.map(app => (
              <div key={app.id} className="interview-row">
                <div className="interview-info">
                  <h4>{app.opportunityTitle} — {app.companyName}</h4>
                  <p>
                    <Clock size={14} /> Scheduled: {new Date(app.interviewDetails?.dateTime).toLocaleString()}
                  </p>
                  {app.interviewDetails?.notes && (
                    <p className="interviewer-notes">"{app.interviewDetails.notes}"</p>
                  )}
                </div>
                <div className="interview-actions">
                  <a 
                    href={app.interviewDetails?.meetingLink || "https://meet.jit.si/Ayush-Portal-Interview"} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-join-call"
                  >
                    <Video size={16} /> Enter Video Room
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: AI Recommendations & Recent Applications */}
      <div className="two-column-layout">
        {/* Left Column: AI Recommendations */}
        <div className="main-column">
          <div className="section-title-row">
            <div>
              <h3>AI-Matched Ayush Internships</h3>
              <p className="section-subtext">Automated keyword & NLP mapping based on your certified skills.</p>
            </div>
            <Link to="/opportunities" className="view-all-link">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="skeleton-loader">Analyzing profile and matching opportunities...</div>
          ) : recommendations.length === 0 ? (
            <div className="empty-card">No current opportunities matching your discipline.</div>
          ) : (
            <div className="recommendations-list">
              {recommendations.slice(0, 3).map((opp) => {
                const applied = isApplied(opp.id);
                return (
                  <div key={opp.id} className="recommendation-card">
                    <div className="rec-header">
                      <div className="company-tag">
                        <Building2 size={16} />
                        <span>{opp.companyName}</span>
                      </div>
                      <div className={`match-badge ${opp.matchScore >= 80 ? 'high' : 'medium'}`}>
                        <Sparkles size={13} />
                        <span>{opp.matchScore}% Skill Match</span>
                      </div>
                    </div>

                    <h4 className="rec-title">{opp.title}</h4>

                    <div className="rec-meta">
                      <span><MapPin size={14} /> {opp.location}</span>
                      <span className="dot">•</span>
                      <span>💰 {opp.stipend}</span>
                      <span className="dot">•</span>
                      <span>⏱️ {opp.duration}</span>
                    </div>

                    <p className="rec-desc">{opp.description}</p>

                    {/* Skill Tags */}
                    <div className="skill-breakdown">
                      <div className="skill-tags-group">
                        <span className="skill-group-label">Matching Skills:</span>
                        {(opp.matchingSkills || []).map((sk, i) => (
                          <span key={i} className="skill-tag match">✓ {sk}</span>
                        ))}
                      </div>

                      {(opp.missingSkills || []).length > 0 && (
                        <div className="skill-tags-group">
                          <span className="skill-group-label">Skill Gap:</span>
                          {opp.missingSkills.map((sk, i) => (
                            <span key={i} className="skill-tag gap">{sk}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {opp.skillGapAdvice && (
                      <div className="skill-advisor-callout">
                        💡 <strong>AI Recommendation:</strong> {opp.skillGapAdvice}
                      </div>
                    )}

                    <div className="rec-footer">
                      <Link to={`/opportunities`} className="btn btn-outline btn-sm">
                        View Details
                      </Link>
                      <button
                        onClick={() => handleApply(opp.id)}
                        disabled={applied || applyLoading === opp.id}
                        className={`btn btn-sm ${applied ? 'btn-applied' : 'btn-primary'}`}
                      >
                        {applied ? (
                          <>
                            <CheckCircle size={14} /> Applied
                          </>
                        ) : applyLoading === opp.id ? (
                          "Submitting..."
                        ) : (
                          "1-Click Apply with Profile"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Application Pipeline & Skills */}
        <div className="side-column">
          {/* Applications Mini Pipeline */}
          <div className="side-box">
            <div className="side-box-header">
              <h4>My Applications</h4>
              <Link to="/applications" className="side-link">Manage</Link>
            </div>

            {applications.length === 0 ? (
              <p className="empty-text">No active applications. Browse internships to apply!</p>
            ) : (
              <div className="apps-mini-list">
                {applications.slice(0, 4).map(app => (
                  <div key={app.id} className="app-mini-card">
                    <div className="app-mini-top">
                      <h5>{app.opportunityTitle}</h5>
                      <span className={`status-pill ${app.status}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="app-mini-company">{app.companyName}</span>
                    <span className="app-mini-date">
                      Applied: {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Skill Inventory Box */}
          <div className="side-box">
            <div className="side-box-header">
              <h4>Certified Competencies</h4>
              <Link to="/skills" className="side-link">Add Skills</Link>
            </div>
            <div className="skills-cloud">
              {(user?.skills || []).map((skill, index) => (
                <span key={index} className="competency-badge">
                  {skill}
                </span>
              ))}
            </div>
            <div className="assessment-prompt-box">
              <Sparkles size={18} className="gold-icon" />
              <div>
                <strong>Verify More Skills</strong>
                <p>Take official Ayush clinical assessments to boost recruiter match ranking.</p>
              </div>
              <Link to="/assessment" className="btn btn-outline btn-xs">
                Take Test
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
