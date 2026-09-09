import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/api';
import { 
  ShieldCheck, 
  Building2, 
  Users, 
  Briefcase, 
  CheckCircle, 
  XCircle, 
  Download, 
  BarChart3, 
  TrendingUp, 
  FileCheck 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [pending, setPending] = useState({ pendingPartners: [], pendingOpportunities: [] });
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewData, pendingData] = await Promise.all([
        adminService.getOverview(),
        adminService.getPending()
      ]);
      setOverview(overviewData);
      setPending(pendingData);
    } catch (err) {
      console.error("Failed to load admin overview:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVerifyPartner = async (partnerId, status) => {
    try {
      await adminService.verifyPartner(partnerId, status);
      setAlertMsg(`Industry partner status updated to: ${status.toUpperCase()}`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveOpp = async (oppId, status) => {
    try {
      await adminService.approveOpportunity(oppId, status);
      setAlertMsg(`Opportunity status updated to: ${status.toUpperCase()}`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Ayush Sector,Students,Opportunities,Placements\n"
      + (overview?.sectorDistribution || []).map(e => `${e.name},${e.students},${e.opportunities},${e.placements}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ministry_Ayush_Placement_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const metrics = overview?.metrics || {
    totalStudents: 1,
    totalIndustryPartners: 4,
    verifiedPartners: 3,
    pendingPartnerApprovals: 1,
    activeOpportunities: 4,
    pendingOpportunityApprovals: 1,
    totalApplications: 2,
    successfulPlacements: 1,
    placementRatePercent: 50
  };

  return (
    <div className="dashboard-container">
      {/* Admin Hero */}
      <div className="ayush-hero-banner admin">
        <div className="hero-left">
          <div className="avatar-circle admin-avatar">
            <ShieldCheck size={32} />
          </div>
          <div className="hero-info">
            <div className="name-row">
              <h2>Ministry of Ayush • Verification Directorate</h2>
              <span className="verified-pill gold">
                Official Regulatory Dashboard
              </span>
            </div>
            <p className="academic-line">
              <span>National Ayush Mission (NAM) Collaborative Portal Governance</span>
              <span className="divider">|</span>
              <span>Officer: <strong>{user?.name || 'Administrator'}</strong></span>
            </p>
          </div>
        </div>

        <div className="hero-right">
          <button onClick={handleExportCSV} className="btn btn-secondary">
            <Download size={16} /> Export Compliance Report
          </button>
        </div>
      </div>

      {alertMsg && (
        <div className="action-alert-box">
          <CheckCircle size={18} />
          <span>{alertMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="skeleton-loader">Loading Ministry analytics & verification queues...</div>
      ) : (
        <>
          {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box green">
            <Users size={22} />
          </div>
          <div className="metric-content">
            <span className="metric-val">{metrics.totalStudents}</span>
            <span className="metric-label">Registered Students</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box teal">
            <Building2 size={22} />
          </div>
          <div className="metric-content">
            <span className="metric-val">{metrics.verifiedPartners} / {metrics.totalIndustryPartners}</span>
            <span className="metric-label">Verified Industry Partners</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box amber">
            <Briefcase size={22} />
          </div>
          <div className="metric-content">
            <span className="metric-val">{metrics.activeOpportunities}</span>
            <span className="metric-label">Approved Internships</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box gold">
            <TrendingUp size={22} />
          </div>
          <div className="metric-content">
            <span className="metric-val">{metrics.placementRatePercent}%</span>
            <span className="metric-label">Sector Placement Rate</span>
          </div>
        </div>
      </div>

      {/* Pending Verifications Queue */}
      <div className="two-column-layout">
        {/* Pending Industry Partners */}
        <div className="main-column">
          <div className="content-card">
            <div className="card-header">
              <div className="card-title-icon">
                <Building2 size={20} className="green-icon" />
                <h3>Pending Industry Partner Verifications</h3>
              </div>
              <span className="info-tag warning">{pending.pendingPartners.length} Pending</span>
            </div>

            {pending.pendingPartners.length === 0 ? (
              <p className="empty-text">All registered industry partners have been reviewed and verified.</p>
            ) : (
              <div className="pending-list">
                {pending.pendingPartners.map(p => (
                  <div key={p.id} className="pending-card">
                    <div className="pending-info">
                      <h4>{p.companyName}</h4>
                      <p className="meta-text">
                        Ayush Sector: <strong>{p.ayushSector.toUpperCase()}</strong> • License: <strong>{p.licenseNumber}</strong>
                      </p>
                      <p className="desc-text">{p.about}</p>
                    </div>
                    <div className="pending-actions">
                      <button
                        onClick={() => handleVerifyPartner(p.id, 'verified')}
                        className="btn btn-primary btn-sm"
                      >
                        <CheckCircle size={14} /> Verify & Accredit
                      </button>
                      <button
                        onClick={() => handleVerifyPartner(p.id, 'rejected')}
                        className="btn btn-outline btn-sm danger"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Opportunities */}
          <div className="content-card">
            <div className="card-header">
              <div className="card-title-icon">
                <FileCheck size={20} className="green-icon" />
                <h3>Pending Internship Approval Queue</h3>
              </div>
              <span className="info-tag warning">{pending.pendingOpportunities.length} Pending</span>
            </div>

            {pending.pendingOpportunities.length === 0 ? (
              <p className="empty-text">No pending internship postings requiring compliance clearance.</p>
            ) : (
              <div className="pending-list">
                {pending.pendingOpportunities.map(opp => (
                  <div key={opp.id} className="pending-card">
                    <div className="pending-info">
                      <h4>{opp.title} — {opp.companyName}</h4>
                      <p className="meta-text">
                        {opp.stream.toUpperCase()} • Stipend: <strong>{opp.stipend}</strong> • Duration: {opp.duration}
                      </p>
                      <p className="desc-text">{opp.description}</p>
                    </div>
                    <div className="pending-actions">
                      <button
                        onClick={() => handleApproveOpp(opp.id, 'approved')}
                        className="btn btn-primary btn-sm"
                      >
                        <CheckCircle size={14} /> Approve Posting
                      </button>
                      <button
                        onClick={() => handleApproveOpp(opp.id, 'rejected')}
                        className="btn btn-outline btn-sm danger"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Analytics & Compliance Sidebar */}
        <div className="side-column">
          <div className="content-card">
            <div className="card-header">
              <div className="card-title-icon">
                <BarChart3 size={20} className="gold-icon" />
                <h4>Ayush Sector Distribution</h4>
              </div>
            </div>
            <div className="chart-container" style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={overview?.sectorDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="students" fill="#137547" name="Students" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="placements" fill="#d97706" name="Placements" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="content-card">
            <div className="card-header">
              <div className="card-title-icon">
                <TrendingUp size={20} className="green-icon" />
                <h4>Skill Demand vs Talent Supply</h4>
              </div>
            </div>
            <div className="chart-container" style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={overview?.skillGaps || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="skill" width={110} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="demand" fill="#ea580c" name="Industry Demand" />
                  <Bar dataKey="supply" fill="#059669" name="Certified Supply" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
