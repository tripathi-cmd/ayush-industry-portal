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
  ShieldCheck 
} from 'lucide-react';

export default function Opportunities() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [streamFilter, setStreamFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [applyLoading, setApplyLoading] = useState(null);
  const [alertMsg, setAlertMsg] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (streamFilter !== 'all') params.stream = streamFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (searchTerm) params.search = searchTerm;

      const [opps, apps] = await Promise.all([
        opportunityService.getAll(params),
        user ? applicationService.getAll().catch(() => []) : Promise.resolve([])
      ]);

      setOpportunities(opps);
      setApplications(apps);
    } catch (err) {
      console.error("Error loading opportunities:", err);
    } finally {
      setLoading(false);
    }
  }, [streamFilter, typeFilter, searchTerm, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleApply = async (oppId) => {
    if (!user) {
      setAlertMsg("Please sign in as a student to apply for opportunities.");
      return;
    }
    if (user.role !== 'student') {
      setAlertMsg("Only registered student candidates can apply for internships.");
      return;
    }

    setApplyLoading(oppId);
    setAlertMsg('');
    try {
      const res = await applicationService.apply(oppId);
      setApplications(prev => [res.application, ...prev]);
      setAlertMsg(`Application submitted successfully for ${res.application.opportunityTitle}!`);
      if (selectedOpp && selectedOpp.id === oppId) {
        setSelectedOpp(null);
      }
    } catch (err) {
      setAlertMsg(err.response?.data?.message || "Failed to submit application.");
    } finally {
      setApplyLoading(null);
    }
  };

  const isApplied = (oppId) => applications.some(a => a.opportunityId === oppId);

  return (
    <div className="dashboard-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h2>Ministry of Ayush Internship & Placement Directory</h2>
          <p className="page-subtitle">
            Explore verified clinical residencies, pharmaceutical research fellowships, and industry placements across India.
          </p>
        </div>
      </div>

      {/* Alert Notification */}
      {alertMsg && (
        <div className="action-alert-box">
          <CheckCircle size={18} />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="filter-card">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by role title, Ayush skill (e.g. Panchakarma), or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>

        <div className="filter-selects-row">
          <div className="filter-group">
            <label><Filter size={14} /> Ayush Discipline:</label>
            <select value={streamFilter} onChange={(e) => setStreamFilter(e.target.value)}>
              <option value="all">All Ayush Disciplines</option>
              <option value="ayurveda">Ayurveda</option>
              <option value="yoga_naturopathy">Yoga & Naturopathy</option>
              <option value="unani">Unani Medicine</option>
              <option value="siddha">Siddha Medicine</option>
              <option value="homeopathy">Homeopathy</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Engagement Type:</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="Internship">Internship</option>
              <option value="Fellowship">Fellowship</option>
              <option value="Placement">Placement / PPO</option>
            </select>
          </div>
        </div>
      </div>

      {/* Opportunities List */}
      {loading ? (
        <div className="skeleton-loader">Loading accredited opportunities...</div>
      ) : opportunities.length === 0 ? (
        <div className="empty-card">No opportunities found matching your filters. Try resetting search criteria.</div>
      ) : (
        <div className="opportunities-grid">
          {opportunities.map(opp => {
            const applied = isApplied(opp.id);
            return (
              <div key={opp.id} className="opp-card">
                <div className="opp-card-top">
                  <div className="opp-company-line">
                    <Building2 size={16} />
                    <span className="opp-company-name">{opp.companyName}</span>
                    <span className="opp-partner-badge" title="Ministry Verified Partner">
                      <ShieldCheck size={13} /> Verified
                    </span>
                  </div>

                  {user?.role === 'student' && opp.matchScore !== undefined && (
                    <div className={`match-badge ${opp.matchScore >= 80 ? 'high' : 'medium'}`}>
                      <Sparkles size={13} />
                      <span>{opp.matchScore}% Match</span>
                    </div>
                  )}
                </div>

                <h3 className="opp-title">{opp.title}</h3>

                <div className="opp-tags-row">
                  <span className="opp-stream-pill">{opp.stream.replace('_', ' ').toUpperCase()}</span>
                  <span className="opp-type-pill">{opp.type}</span>
                </div>

                <div className="opp-meta-list">
                  <div className="meta-item">
                    <MapPin size={15} />
                    <span>{opp.location}</span>
                  </div>
                  <div className="meta-item">
                    <span>💰</span>
                    <span>{opp.stipend}</span>
                  </div>
                  <div className="meta-item">
                    <Clock size={15} />
                    <span>{opp.duration}</span>
                  </div>
                </div>

                <p className="opp-description">
                  {opp.description.slice(0, 140)}...
                </p>

                {/* Required Skills */}
                <div className="opp-skills-box">
                  <span className="skills-heading">Required Competencies:</span>
                  <div className="skills-wrap">
                    {(opp.requiredSkills || []).slice(0, 3).map((sk, i) => (
                      <span key={i} className="skill-pill-sm">{sk}</span>
                    ))}
                    {(opp.requiredSkills || []).length > 3 && (
                      <span className="skill-pill-sm more">+{opp.requiredSkills.length - 3} more</span>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="opp-footer">
                  <button 
                    onClick={() => setSelectedOpp(opp)}
                    className="btn btn-outline btn-sm"
                  >
                    View Details
                  </button>

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
                      "Applying..."
                    ) : (
                      "Apply with Profile"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Opportunity Detail Modal */}
      {selectedOpp && (
        <div className="modal-overlay" onClick={() => setSelectedOpp(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="opp-stream-pill">{selectedOpp.stream.toUpperCase()}</span>
                <h3>{selectedOpp.title}</h3>
                <span className="modal-company">{selectedOpp.companyName}</span>
              </div>
              <button onClick={() => setSelectedOpp(null)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-metrics-bar">
                <div>
                  <strong>Location</strong>
                  <p>{selectedOpp.location}</p>
                </div>
                <div>
                  <strong>Stipend</strong>
                  <p>{selectedOpp.stipend}</p>
                </div>
                <div>
                  <strong>Duration</strong>
                  <p>{selectedOpp.duration}</p>
                </div>
                <div>
                  <strong>Openings</strong>
                  <p>{selectedOpp.openings} Positions</p>
                </div>
              </div>

              <div className="modal-section">
                <h4>Role Description</h4>
                <p>{selectedOpp.description}</p>
              </div>

              <div className="modal-section">
                <h4>Eligibility Criteria</h4>
                <p>{selectedOpp.eligibility}</p>
              </div>

              <div className="modal-section">
                <h4>Required Ayush Competencies</h4>
                <div className="skills-wrap">
                  {(selectedOpp.requiredSkills || []).map((sk, i) => (
                    <span key={i} className="skill-pill-sm">{sk}</span>
                  ))}
                </div>
              </div>

              {user?.role === 'student' && selectedOpp.matchScore !== undefined && (
                <div className="modal-section ai-box">
                  <div className="ai-box-title">
                    <Sparkles size={16} />
                    <span>AI Profile Compatibility: {selectedOpp.matchScore}%</span>
                  </div>
                  <p>Based on your registered Ayush skills and clinical assessment benchmarks.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setSelectedOpp(null)} className="btn btn-outline">
                Close
              </button>
              <button
                onClick={() => handleApply(selectedOpp.id)}
                disabled={isApplied(selectedOpp.id) || applyLoading === selectedOpp.id}
                className={`btn ${isApplied(selectedOpp.id) ? 'btn-applied' : 'btn-primary'}`}
              >
                {isApplied(selectedOpp.id) ? "Applied" : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
