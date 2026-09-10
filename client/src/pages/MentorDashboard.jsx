import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { mentorService } from '../services/api';
import { 
  Users, 
  Target, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  Plus, 
  AlertTriangle,
  GraduationCap,
  Sparkles,
  BookOpen,
  ArrowRight
} from 'lucide-react';

export default function MentorDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [goalsList, setGoalsList] = useState([]);
  const [newFeedback, setNewFeedback] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const isPending = user?.approval === 'pending';

  const loadStudents = useCallback(async () => {
    if (isPending) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await mentorService.getStudents();
      setStudents(data);
      if (data.length > 0 && !selectedStudent) {
        setSelectedStudent(data[0]);
      }
    } catch (err) {
      console.error('Error loading mentor students:', err);
    } finally {
      setLoading(false);
    }
  }, [isPending, selectedStudent]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const loadStudentDetails = useCallback(async (student) => {
    if (!student) return;
    try {
      const [fb, goals] = await Promise.all([
        mentorService.getFeedback(student.assignment_id),
        mentorService.getLearningGoals(student.assignment_id)
      ]);
      setFeedbackList(fb);
      setGoalsList(goals);
    } catch (err) {
      console.error('Failed to load student mentorship data:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentDetails(selectedStudent);
    }
  }, [selectedStudent, loadStudentDetails]);

  const handleAddFeedback = async (e) => {
    e.preventDefault();
    if (!newFeedback.trim() || !selectedStudent) return;
    setActionLoading(true);
    setMsg({ text: '', type: '' });
    try {
      await mentorService.addFeedback(selectedStudent.assignment_id, newFeedback);
      setNewFeedback('');
      setMsg({ text: 'Feedback successfully shared with student.', type: 'success' });
      loadStudentDetails(selectedStudent);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to submit feedback', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!goalTitle.trim() || !selectedStudent) return;
    setActionLoading(true);
    setMsg({ text: '', type: '' });
    try {
      await mentorService.addLearningGoal(selectedStudent.assignment_id, goalTitle, goalDesc);
      setGoalTitle('');
      setGoalDesc('');
      setShowGoalModal(false);
      setMsg({ text: 'Learning goal assigned to student.', type: 'success' });
      loadStudentDetails(selectedStudent);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to add learning goal', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const getGoalStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="status-badge status-accepted"><CheckCircle size={12} /> Completed</span>;
      case 'in_progress':
        return <span className="status-badge status-review"><Clock size={12} /> In Progress</span>;
      default:
        return <span className="status-badge status-applied">Not Started</span>;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h2>Academic & Industry Mentor Portal</h2>
          <p className="page-subtitle">
            Guide assigned students, review their skill progression, provide actionable feedback, and set targeted learning milestones.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`status-badge ${isPending ? 'status-review' : 'status-accepted'}`} style={{ fontSize: '13px', padding: '6px 14px' }}>
            {isPending ? 'Pending Admin Approval' : 'Verified Mentor'}
          </span>
        </div>
      </div>

      {/* Pending Banner */}
      {isPending && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fef3c7',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start'
        }}>
          <AlertTriangle size={24} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ color: '#92400e', margin: '0 0 6px 0', fontSize: '16px' }}>Account Pending Verification</h4>
            <p style={{ color: '#b45309', margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
              Your mentor account is currently pending administrator verification. Once an administrator approves your profile,
              students will be assigned to you and their learning profiles will appear here for mentorship.
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      {msg.text && (
        <div className={`alert-box ${msg.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: msg.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: msg.type === 'error' ? '#991b1b' : '#166534',
          border: `1px solid ${msg.type === 'error' ? '#fecaca' : '#bbf7d0'}`
        }}>
          {msg.text}
        </div>
      )}

      {!isPending && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
          {/* Left Column: Assigned Students List */}
          <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#2563eb" /> Assigned Students ({students.length})
              </h3>
            </div>

            {loading ? (
              <div style={{ color: '#64748b', textAlign: 'center', padding: '30px 0' }}>Loading students...</div>
            ) : students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 12px', color: '#64748b' }}>
                <GraduationCap size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>No students assigned yet.</p>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Portal administrators assign students to verified mentors.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {students.map(st => {
                  const isSelected = selectedStudent?.assignment_id === st.assignment_id;
                  return (
                    <div
                      key={st.assignment_id}
                      onClick={() => setSelectedStudent(st)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: isSelected ? '#eff6ff' : '#f8fafc',
                        border: isSelected ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>{st.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{st.email}</div>
                      {st.profile?.degree && (
                        <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '4px', fontWeight: 500 }}>
                          {st.profile.degree} • {st.profile.institution || 'Academic Institute'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Selected Student Details & Mentorship Tools */}
          {selectedStudent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Student Profile Card */}
              <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a' }}>
                      {selectedStudent.name}
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                      {selectedStudent.profile?.degree || 'Candidate'} • {selectedStudent.profile?.institution || 'Institution'} • {selectedStudent.email}
                    </p>
                    {selectedStudent.profile?.bio && (
                      <p style={{ color: '#475569', fontSize: '13px', marginTop: '8px', fontStyle: 'italic' }}>
                        "{selectedStudent.profile.bio}"
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowGoalModal(true)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                  >
                    <Plus size={16} /> Assign Goal
                  </button>
                </div>

                {/* Skills */}
                <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                    Student Skills ({selectedStudent.profile?.skills?.length || 0})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(selectedStudent.profile?.skills || []).length === 0 ? (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Student has not added skills yet.</span>
                    ) : (
                      selectedStudent.profile.skills.map((sk, idx) => (
                        <span key={idx} className="skill-chip" style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, color: '#334155' }}>
                          {sk}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Mentorship Grid: Learning Goals & Feedback */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Learning Goals */}
                <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Target size={18} color="#2563eb" /> Learning Goals ({goalsList.length})
                    </h4>
                  </div>

                  {goalsList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: '13px' }}>
                      No learning goals assigned yet. Use the "Assign Goal" button to create actionable milestones.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {goalsList.map(g => (
                        <div key={g.id} style={{ padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{g.title}</span>
                            {getGoalStatusBadge(g.status)}
                          </div>
                          {g.description && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>{g.description}</p>
                          )}
                          <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', display: 'block' }}>
                            Assigned on {new Date(g.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mentor Feedback Feed */}
                <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquare size={18} color="#059669" /> Mentor Feedback
                  </h4>

                  {/* Add Feedback Input */}
                  <form onSubmit={handleAddFeedback} style={{ marginBottom: '16px' }}>
                    <textarea
                      rows={3}
                      value={newFeedback}
                      onChange={(e) => setNewFeedback(e.target.value)}
                      placeholder="Write actionable guidance, project feedback, or career advice for this student..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button
                        type="submit"
                        disabled={actionLoading || !newFeedback.trim()}
                        className="btn btn-primary"
                        style={{ fontSize: '12px', padding: '6px 14px' }}
                      >
                        {actionLoading ? 'Saving...' : 'Post Guidance'}
                      </button>
                    </div>
                  </form>

                  {/* Existing Feedback History */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                    {feedbackList.length === 0 ? (
                      <span style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
                        No feedback history yet.
                      </span>
                    ) : (
                      feedbackList.map(fb => (
                        <div key={fb.id} style={{ padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#1e293b', whiteSpace: 'pre-wrap' }}>
                            {fb.feedback}
                          </p>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            Posted on {new Date(fb.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '40px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
              <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <h3>Select a Student</h3>
              <p>Choose an assigned student from the list on the left to review their profile, assign learning goals, and share feedback.</p>
            </div>
          )}
        </div>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
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
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Assign Learning Goal</h3>
            <form onSubmit={handleAddGoal}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Goal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build REST API in Node.js & write unit tests"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Description / Resources</label>
                <textarea
                  rows={3}
                  placeholder="Provide guidance, reference articles, or target completion requirements..."
                  value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !goalTitle.trim()}
                  className="btn btn-primary"
                >
                  {actionLoading ? 'Assigning...' : 'Assign Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
