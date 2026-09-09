import { useState, useEffect } from 'react';
import { applicationService } from '../services/api';
import { 
  FileText, 
  Clock, 
  Building2, 
  Calendar, 
  Video, 
  CheckCircle, 
  Sparkles 
} from 'lucide-react';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    async function loadApps() {
      setLoading(true);
      try {
        const list = await applicationService.getAll();
        setApplications(list);
      } catch (err) {
        console.error("Error loading applications:", err);
      } finally {
        setLoading(false);
      }
    }
    loadApps();
  }, []);

  const getStatusStepIndex = (status) => {
    switch (status) {
      case 'applied': return 0;
      case 'under_review': return 1;
      case 'shortlisted': return 2;
      case 'interview_scheduled': return 3;
      case 'offered':
      case 'accepted': return 4;
      case 'rejected': return -1;
      default: return 0;
    }
  };

  const steps = [
    "Applied",
    "Under Review",
    "Shortlisted",
    "Interview",
    "Offered"
  ];

  const filtered = applications.filter(a => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  return (
    <div className="dashboard-container">
      <div className="page-header-row">
        <div>
          <h2>My Ayush Internship Applications</h2>
          <p className="page-subtitle">
            Track real-time selection pipelines, recruitment milestones, and upcoming interview calls with industry partners.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="status-filter-tabs">
        {[
          { id: 'all', label: 'All Applications' },
          { id: 'applied', label: 'Applied' },
          { id: 'shortlisted', label: 'Shortlisted' },
          { id: 'interview_scheduled', label: 'Interview Scheduled' },
          { id: 'offered', label: 'Offered' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`status-tab ${filterStatus === tab.id ? 'active' : ''}`}
            onClick={() => setFilterStatus(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="skeleton-loader">Loading application status records...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-card">
          <FileText size={48} className="empty-icon" />
          <p>No applications found under this status.</p>
          <a href="/opportunities" className="btn btn-primary btn-sm">Browse Internships</a>
        </div>
      ) : (
        <div className="applications-list">
          {filtered.map(app => {
            const stepIndex = getStatusStepIndex(app.status);
            const isRejected = app.status === 'rejected';

            return (
              <div key={app.id} className="app-card">
                <div className="app-card-top">
                  <div>
                    <div className="app-company">
                      <Building2 size={16} />
                      <span>{app.companyName}</span>
                    </div>
                    <h3 className="app-title">{app.opportunityTitle}</h3>
                    <span className="app-date">
                      <Clock size={13} /> Applied on: {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="app-top-right">
                    {app.matchScore && (
                      <div className="match-pill">
                        <Sparkles size={14} />
                        <span>{app.matchScore}% Match Score</span>
                      </div>
                    )}
                    <span className={`status-badge ${app.status}`}>
                      {app.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="pipeline-tracker">
                  {steps.map((st, i) => {
                    const isCompleted = !isRejected && i <= stepIndex;
                    const isCurrent = !isRejected && i === stepIndex;

                    return (
                      <div key={i} className={`pipeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                        <div className="step-circle">
                          {isCompleted ? <CheckCircle size={14} /> : i + 1}
                        </div>
                        <span className="step-label">{st}</span>
                        {i < steps.length - 1 && <div className="step-line"></div>}
                      </div>
                    );
                  })}
                </div>

                {/* Interview Information Banner */}
                {app.status === 'interview_scheduled' && app.interviewDetails && (
                  <div className="interview-scheduled-box">
                    <div className="interview-box-header">
                      <Video size={18} />
                      <strong>Official Interview Scheduled</strong>
                    </div>
                    <div className="interview-box-details">
                      <p>
                        <Calendar size={14} /> Date & Time: <strong>{new Date(app.interviewDetails.dateTime).toLocaleString()}</strong>
                      </p>
                      {app.interviewDetails.interviewer && (
                        <p>Interviewer: <strong>{app.interviewDetails.interviewer}</strong></p>
                      )}
                      {app.interviewDetails.notes && (
                        <p className="interviewer-msg">Instructions: "{app.interviewDetails.notes}"</p>
                      )}
                    </div>
                    <div className="interview-box-actions">
                      <a
                        href={app.interviewDetails.meetingLink || "https://meet.jit.si/Ayush-Portal-Interview"}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-join-call"
                      >
                        <Video size={16} /> Join Secure Video Room (Jitsi Meet)
                      </a>
                    </div>
                  </div>
                )}

                {/* Offer Banner */}
                {(app.status === 'offered' || app.status === 'accepted') && (
                  <div className="offer-celebration-box">
                    🎉 <strong>Congratulations!</strong> You have received an official placement / internship offer from {app.companyName}!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
