import { useState, useEffect } from 'react';
import { applicationService } from '../services/api';
import { 
  FileText, 
  Clock, 
  Building2, 
  Calendar, 
  Video, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  ExternalLink
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
          <h2>Internship & Placement Applications</h2>
          <p className="page-subtitle">
            Track your application review milestones, interview schedules, and placement offers in real time.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="status-filter-tabs" style={{ marginBottom: '20px' }}>
        {[
          { id: 'all', label: 'All Applications' },
          { id: 'applied', label: 'Applied' },
          { id: 'under_review', label: 'Under Review' },
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
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading applications...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ background: '#fff', padding: '40px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
          <FileText size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <h4 style={{ margin: '0 0 6px 0', color: '#334155' }}>No Applications Found</h4>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94a3b8' }}>
            {filterStatus === 'all' ? "You have not submitted any applications yet." : `No applications currently have status "${filterStatus}".`}
          </p>
          <a href="/opportunities" className="btn btn-primary btn-sm">Browse Opportunities</a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map(app => {
            const stepIndex = getStatusStepIndex(app.status);
            const isRejected = app.status === 'rejected';
            const snap = app.match_snapshot || {};

            return (
              <div
                key={app.id}
                className="card"
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a' }}>
                      {app.opportunity_title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                      <Building2 size={14} /> <span>{app.company_name}</span>
                      {app.opportunity_location && <span>• {app.opportunity_location}</span>}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className={`status-badge status-${app.status}`} style={{ fontSize: '12px', textTransform: 'capitalize' }}>
                      {app.status.replace(/_/g, ' ')}
                    </span>
                    <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      Applied on {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Progress Step Bar */}
                {!isRejected ? (
                  <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '14px', left: '20px', right: '20px', height: '2px', background: '#e2e8f0', zIndex: 0 }}></div>
                    <div style={{
                      position: 'absolute',
                      top: '14px',
                      left: '20px',
                      width: `${(Math.max(0, stepIndex) / (steps.length - 1)) * 90}%`,
                      height: '2px',
                      background: '#2563eb',
                      zIndex: 1,
                      transition: 'width 0.3s ease'
                    }}></div>

                    {steps.map((label, idx) => {
                      const isComplete = idx <= stepIndex;
                      const isCurrent = idx === stepIndex;
                      return (
                        <div key={idx} style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: isComplete ? '#2563eb' : '#fff',
                            border: `2px solid ${isComplete ? '#2563eb' : '#cbd5e1'}`,
                            color: isComplete ? '#fff' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 600
                          }}>
                            {isComplete ? '✓' : idx + 1}
                          </div>
                          <span style={{ fontSize: '11px', marginTop: '6px', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#1e3a8a' : '#64748b' }}>
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', margin: '16px 0' }}>
                    <XCircle size={16} />
                    <span>Application not selected for this position.</span>
                  </div>
                )}

                {/* Interview details banner */}
                {app.status === 'interview_scheduled' && app.interview_details && (
                  <div style={{
                    marginTop: '16px',
                    padding: '14px 18px',
                    background: '#eff6ff',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={16} /> Interview Details
                      </h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>
                        Date & Time: {app.interview_details.date ? new Date(app.interview_details.date).toLocaleString() : 'TBD'}
                      </p>
                      {app.interview_details.notes && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#475569' }}>
                          Notes: {app.interview_details.notes}
                        </p>
                      )}
                    </div>
                    {app.interview_details.meetingUrl && (
                      <a
                        href={app.interview_details.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                      >
                        <Video size={14} /> Join Video Call <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                )}

                {/* Match Snapshot */}
                {snap.matchScore !== undefined && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Recorded Compatibility: <strong>{snap.matchScore}%</strong>
                    </span>
                    {snap.matchingSkills && snap.matchingSkills.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {snap.matchingSkills.map((sk, idx) => (
                          <span key={idx} style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', padding: '1px 6px', borderRadius: '4px' }}>
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}
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
