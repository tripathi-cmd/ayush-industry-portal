import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { opportunityService, applicationService } from '../services/api';
import { 
  Search, 
  MapPin, 
  Building2, 
  Clock, 
  CheckCircle, 
  Sparkles, 
  X, 
  Filter,
  Briefcase
} from 'lucide-react';

export default function Opportunities() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [applyLoading, setApplyLoading] = useState(null);
  const [alertMsg, setAlertMsg] = useState({ text: '', type: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      if (searchTerm) params.search = searchTerm;

      const [opps, apps] = await Promise.all([
        opportunityService.getAll(params),
        user && user.role === 'student' ? applicationService.getAll().catch(() => []) : Promise.resolve([])
      ]);

      setOpportunities(opps);
      setApplications(apps);
    } catch (err) {
      console.error("Error loading opportunities:", err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, searchTerm, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleApply = async (oppId) => {
    if (!user) {
      setAlertMsg({ text: "Please sign in as a student to apply for opportunities.", type: 'error' });
      return;
    }
    if (user.role !== 'student') {
      setAlertMsg({ text: "Only student accounts can apply for internship and job opportunities.", type: 'error' });
      return;
    }

    setApplyLoading(oppId);
    setAlertMsg({ text: '', type: '' });
    try {
      const res = await applicationService.apply(oppId);
      setApplications(prev => [res.application, ...prev]);
      setAlertMsg({ text: `Application submitted successfully!`, type: 'success' });
      if (selectedOpp && selectedOpp.id === oppId) {
        setSelectedOpp(null);
      }
    } catch (err) {
      setAlertMsg({ text: err.response?.data?.message || "Failed to submit application.", type: 'error' });
    } finally {
      setApplyLoading(null);
    }
  };

  const isApplied = (oppId) => applications.some(a => a.opportunity_id === oppId || a.opportunityId === oppId);

  return (
    <div className="dashboard-container">
      <div className="page-header-row">
        <div>
          <h2>Academia–Industry Opportunities Directory</h2>
          <p className="page-subtitle">
            Explore verified internships, apprenticeships, and entry-level positions posted by approved industry partners.
          </p>
        </div>
      </div>

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

      {/* Filter and Search Bar */}
      <div className="filter-bar" style={{
        background: '#fff',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flex: 1, minWidth: '280px', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by role title, company, skills, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0 16px' }}>
            Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={16} color="#64748b" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
          >
            <option value="all">All Types</option>
            <option value="Internship">Internship</option>
            <option value="Full-time">Full-time Job</option>
            <option value="Apprenticeship">Apprenticeship</option>
            <option value="Project">Live Project</option>
          </select>
        </div>
      </div>

      {/* Opportunities List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading opportunities...</div>
      ) : opportunities.length === 0 ? (
        <div className="card" style={{ background: '#fff', padding: '40px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
          <Briefcase size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
          <h4>No Opportunities Match Your Criteria</h4>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {opportunities.map(opp => {
            const applied = isApplied(opp.id);
            const score = opp.matchScore;
            return (
              <div
                key={opp.id}
                className="card"
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '22px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', background: '#eff6ff', color: '#2563eb' }}>
                      {opp.type}
                    </span>
                    {score !== null && score !== undefined && (
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '12px',
                        backgroundColor: score >= 75 ? '#dcfce7' : score >= 50 ? '#fef3c7' : '#fee2e2',
                        color: score >= 75 ? '#15803d' : score >= 50 ? '#b45309' : '#b91c1c'
                      }}>
                        {score}% Match
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a' }}>
                    {opp.title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', marginBottom: '12px' }}>
                    <Building2 size={14} /> <span>{opp.company_name}</span> • <MapPin size={14} /> <span>{opp.location}</span>
                  </div>

                  {opp.description && (
                    <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 14px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {opp.description}
                    </p>
                  )}

                  {/* Required skills chips */}
                  {opp.required_skills && opp.required_skills.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {opp.required_skills.slice(0, 5).map((sk, idx) => (
                          <span key={idx} style={{ background: '#f1f5f9', color: '#334155', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 500 }}>
                            {sk}
                          </span>
                        ))}
                        {opp.required_skills.length > 5 && (
                          <span style={{ fontSize: '11px', color: '#94a3b8', alignSelf: 'center' }}>
                            +{opp.required_skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', display: 'block' }}>{opp.stipend}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{opp.duration}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setSelectedOpp(opp)}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '12px' }}
                    >
                      Details
                    </button>
                    {user?.role === 'student' && (
                      <button
                        onClick={() => handleApply(opp.id)}
                        disabled={applied || applyLoading === opp.id}
                        className={applied ? "btn btn-outline btn-sm" : "btn btn-primary btn-sm"}
                        style={{ fontSize: '12px' }}
                      >
                        {applied ? '✓ Applied' : applyLoading === opp.id ? 'Applying...' : 'Apply'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedOpp && (
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
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', background: '#eff6ff', color: '#2563eb' }}>
                  {selectedOpp.type}
                </span>
                <h3 style={{ margin: '6px 0 2px 0', fontSize: '20px', color: '#0f172a' }}>{selectedOpp.title}</h3>
                <span style={{ fontSize: '14px', color: '#64748b' }}>{selectedOpp.company_name} • {selectedOpp.location}</span>
              </div>
              <button onClick={() => setSelectedOpp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#94a3b8" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Compensation</span>
                <p style={{ margin: '2px 0 0 0', fontWeight: 600, fontSize: '13px' }}>{selectedOpp.stipend}</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Duration</span>
                <p style={{ margin: '2px 0 0 0', fontWeight: 600, fontSize: '13px' }}>{selectedOpp.duration}</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Openings</span>
                <p style={{ margin: '2px 0 0 0', fontWeight: 600, fontSize: '13px' }}>{selectedOpp.openings} positions</p>
              </div>
            </div>

            {selectedOpp.description && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 6px 0' }}>Job Description</h4>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {selectedOpp.description}
                </p>
              </div>
            )}

            {selectedOpp.eligibility && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 6px 0' }}>Eligibility</h4>
                <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>{selectedOpp.eligibility}</p>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 8px 0' }}>Required Skills</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(selectedOpp.required_skills || []).map((sk, idx) => (
                  <span key={idx} style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '12px', padding: '4px 10px', borderRadius: '6px', fontWeight: 500 }}>
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setSelectedOpp(null)} className="btn btn-outline">
                Close
              </button>
              {user?.role === 'student' && (
                <button
                  onClick={() => handleApply(selectedOpp.id)}
                  disabled={isApplied(selectedOpp.id) || applyLoading === selectedOpp.id}
                  className="btn btn-primary"
                >
                  {isApplied(selectedOpp.id) ? '✓ Already Applied' : applyLoading === selectedOpp.id ? 'Submitting...' : 'Apply for Opportunity'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
