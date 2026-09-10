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
  Award,
  UserCheck,
  Plus,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [pending, setPending] = useState({ pendingUsers: [], pendingOpportunities: [] });
  const [mentorships, setMentorships] = useState([]);
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('pending');

  // Mentorship assign form
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewData, pendingData, mentorAssignments, allStudents, allMentors] = await Promise.all([
        adminService.getOverview(),
        adminService.getPending(),
        adminService.getMentorshipAssignments().catch(() => []),
        adminService.getUsers('student').catch(() => []),
        adminService.getUsers('mentor').catch(() => [])
      ]);
      setOverview(overviewData);
      setPending(pendingData);
      setMentorships(mentorAssignments);
      setStudents(allStudents);
      setMentors(allMentors.filter(m => m.approval === 'approved'));
    } catch (err) {
      console.error("Failed to load admin overview:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUserApproval = async (userId, approval) => {
    setAlertMsg({ text: '', type: '' });
    try {
      await adminService.updateUserApproval(userId, approval);
      setAlertMsg({ text: `User account successfully ${approval}.`, type: 'success' });
      loadData();
    } catch (err) {
      setAlertMsg({ text: err.response?.data?.message || "Failed to update user approval", type: 'error' });
    }
  };

  const handleOppApproval = async (oppId, status) => {
    setAlertMsg({ text: '', type: '' });
    try {
      await adminService.updateOpportunityStatus(oppId, status);
      setAlertMsg({ text: `Opportunity listing ${status}.`, type: 'success' });
      loadData();
    } catch (err) {
      setAlertMsg({ text: err.response?.data?.message || "Failed to update opportunity status", type: 'error' });
    }
  };

  const handleAssignMentorship = async (e) => {
    e.preventDefault();
    if (!selectedMentorId || !selectedStudentId) return;
    setAssignLoading(true);
    setAlertMsg({ text: '', type: '' });
    try {
      await adminService.assignMentorship(selectedMentorId, selectedStudentId);
      setAlertMsg({ text: 'Mentor and student successfully paired!', type: 'success' });
      setSelectedMentorId('');
      setSelectedStudentId('');
      loadData();
    } catch (err) {
      setAlertMsg({ text: err.response?.data?.message || 'Failed to assign mentorship', type: 'error' });
    } finally {
      setAssignLoading(false);
    }
  };

  const metrics = overview?.metrics || {
    totalStudents: 0,
    totalRecruiters: 0,
    totalMentors: 0,
    pendingApprovals: 0,
    activeOpportunities: 0,
    pendingOpportunities: 0,
    totalApplications: 0,
    successfulPlacements: 0
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h2>Portal Administration Console</h2>
          <p className="page-subtitle">
            System governance, partner approval queues, opportunity verification, and student–mentor assignments.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="status-badge status-accepted" style={{ fontSize: '13px', padding: '6px 14px' }}>
            <ShieldCheck size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Administrator
          </span>
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

      {/* Database-derived Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '18px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Enrolled Students</span>
          <h3 style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0 0 0', color: '#0f172a' }}>
            {metrics.totalStudents}
          </h3>
        </div>
        <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '18px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Recruiters & Mentors</span>
          <h3 style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0 0 0', color: '#2563eb' }}>
            {metrics.totalRecruiters + metrics.totalMentors}
            <span style={{ fontSize: '12px', fontWeight: 400, color: '#64748b', marginLeft: '6px' }}>
              ({metrics.totalRecruiters} rec / {metrics.totalMentors} men)
            </span>
          </h3>
        </div>
        <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '18px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Pending Approvals</span>
          <h3 style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0 0 0', color: metrics.pendingApprovals + metrics.pendingOpportunities > 0 ? '#d97706' : '#16a34a' }}>
            {metrics.pendingApprovals + metrics.pendingOpportunities}
            <span style={{ fontSize: '12px', fontWeight: 400, color: '#64748b', marginLeft: '6px' }}>
              ({metrics.pendingApprovals} users / {metrics.pendingOpportunities} opps)
            </span>
          </h3>
        </div>
        <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '18px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Successful Placements</span>
          <h3 style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0 0 0', color: '#059669' }}>
            {metrics.successfulPlacements}
          </h3>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'pending' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'pending' ? '#2563eb' : '#64748b',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Pending Approvals ({pending.pendingUsers?.length + pending.pendingOpportunities?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('mentorship')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'mentorship' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'mentorship' ? '#2563eb' : '#64748b',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Mentorship Assignments ({mentorships.length})
        </button>
      </div>

      {/* TAB 1: Pending Approvals */}
      {activeTab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Pending Users */}
          <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0', color: '#0f172a' }}>
              Pending Recruiter & Mentor Registrations ({pending.pendingUsers?.length || 0})
            </h3>

            {(!pending.pendingUsers || pending.pendingUsers.length === 0) ? (
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>No partner accounts awaiting approval.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pending.pendingUsers.map(u => (
                  <div
                    key={u.id}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#eff6ff', color: '#2563eb' }}>
                          {u.role.toUpperCase()}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>{u.name}</h4>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Email: {u.email}
                        {u.profile?.companyName && ` • Company: ${u.profile.companyName}`}
                        {u.profile?.expertise && ` • Domain: ${u.profile.expertise}`}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleUserApproval(u.id, 'approved')}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '12px', background: '#16a34a', borderColor: '#16a34a' }}
                      >
                        <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleUserApproval(u.id, 'rejected')}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '12px', color: '#dc2626', borderColor: '#fecaca' }}
                      >
                        <XCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Opportunities */}
          <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0', color: '#0f172a' }}>
              Pending Opportunity Submissions ({pending.pendingOpportunities?.length || 0})
            </h3>

            {(!pending.pendingOpportunities || pending.pendingOpportunities.length === 0) ? (
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>No opportunity listings awaiting review.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pending.pendingOpportunities.map(opp => (
                  <div
                    key={opp.id}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#eff6ff', color: '#2563eb' }}>
                          {opp.type}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>{opp.title}</h4>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Company: <strong>{opp.company_name}</strong> • {opp.location} • {opp.stipend} • {opp.duration}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleOppApproval(opp.id, 'approved')}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '12px', background: '#16a34a', borderColor: '#16a34a' }}
                      >
                        <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        Approve & Publish
                      </button>
                      <button
                        onClick={() => handleOppApproval(opp.id, 'rejected')}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '12px', color: '#dc2626', borderColor: '#fecaca' }}
                      >
                        <XCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Mentorship Assignments */}
      {activeTab === 'mentorship' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {/* Pair Form */}
          <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={18} color="#2563eb" /> Assign Mentor
            </h3>

            <form onSubmit={handleAssignMentorship}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Select Approved Mentor *
                </label>
                <select
                  required
                  value={selectedMentorId}
                  onChange={(e) => setSelectedMentorId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="">-- Choose Mentor --</option>
                  {mentors.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.profile?.expertise || 'Mentor'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Select Student *
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={assignLoading || !selectedMentorId || !selectedStudentId}
                className="btn btn-primary btn-block"
                style={{ width: '100%', padding: '10px', fontSize: '13px' }}
              >
                {assignLoading ? 'Assigning...' : 'Assign Mentorship'}
              </button>
            </form>
          </div>

          {/* Active Assignments Table */}
          <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0' }}>
              Active Mentorship Pairings ({mentorships.length})
            </h3>

            {mentorships.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>No mentor-student pairings established yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mentorships.map(ma => (
                  <div
                    key={ma.id}
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                        Mentor: {ma.mentor_name} <span style={{ color: '#64748b', fontWeight: 400 }}>({ma.mentor_email})</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#2563eb', marginTop: '2px' }}>
                        Student: {ma.student_name} <span style={{ color: '#64748b' }}>({ma.student_email})</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Assigned: {new Date(ma.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
