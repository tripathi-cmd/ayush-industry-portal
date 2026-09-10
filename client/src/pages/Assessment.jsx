import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { assessmentService } from '../services/api';
import { 
  Sparkles, 
  Clock, 
  Award, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  BookOpen,
  RotateCcw,
  Check
} from 'lucide-react';

export default function Assessment() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [asList, attList] = await Promise.all([
          assessmentService.getAll(),
          assessmentService.getMyAttempts().catch(() => [])
        ]);
        setAssessments(asList);
        setAttempts(attList);
      } catch (err) {
        console.error("Error loading assessments:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleStart = async (asmId) => {
    try {
      const full = await assessmentService.getById(asmId);
      setActiveAssessment(full);
      setAnswers({});
      setResult(null);
    } catch (err) {
      console.error("Error loading assessment details:", err);
    }
  };

  const handleSelectOption = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    if (!activeAssessment) return;
    setIsSubmitting(true);
    try {
      const res = await assessmentService.submit(activeAssessment.id, answers);
      setResult(res);
      // Refresh attempts
      const updatedAttempts = await assessmentService.getMyAttempts().catch(() => []);
      setAttempts(updatedAttempts);
    } catch (err) {
      console.error("Assessment submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setActiveAssessment(null);
    setAnswers({});
    setResult(null);
  };

  return (
    <div className="dashboard-container">
      <div className="page-header-row">
        <div>
          <h2>Standardized Skill Assessments</h2>
          <p className="page-subtitle">
            Validate your technical proficiency and professional competencies to enhance your profile visibility with hiring partners.
          </p>
        </div>
      </div>

      {/* Active Quiz View */}
      {activeAssessment ? (
        <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '28px', border: '1px solid #e2e8f0' }}>
          {/* Result view */}
          {result ? (
            <div>
              <div style={{
                textAlign: 'center',
                padding: '30px',
                background: result.passed ? '#f0fdf4' : '#fef2f2',
                borderRadius: '12px',
                marginBottom: '24px',
                border: `1px solid ${result.passed ? '#bbf7d0' : '#fecaca'}`
              }}>
                {result.passed ? (
                  <CheckCircle size={48} color="#16a34a" style={{ marginBottom: '8px' }} />
                ) : (
                  <XCircle size={48} color="#dc2626" style={{ marginBottom: '8px' }} />
                )}
                <h3 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', color: result.passed ? '#166534' : '#991b1b' }}>
                  {result.passed ? 'Assessment Passed!' : 'Assessment Not Passed'}
                </h3>
                <p style={{ fontSize: '15px', color: '#475569', margin: '0 0 12px 0' }}>
                  You scored <strong>{result.score}%</strong> ({result.correctCount} out of {result.totalQuestions} questions correct).
                  Passing threshold is {activeAssessment.passing_score}%.
                </p>
                <button onClick={resetQuiz} className="btn btn-primary" style={{ fontSize: '13px' }}>
                  Return to Assessments List
                </button>
              </div>

              {/* Question Review */}
              <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0' }}>Question-by-Question Review</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {result.review?.map((rev, idx) => (
                  <div
                    key={rev.id}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      background: rev.isCorrect ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${rev.isCorrect ? '#bbf7d0' : '#fecaca'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                        {idx + 1}. {rev.question}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: rev.isCorrect ? '#dcfce7' : '#fee2e2',
                        color: rev.isCorrect ? '#15803d' : '#b91c1c'
                      }}>
                        {rev.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: '#334155', marginTop: '6px' }}>
                      <strong>Your Answer:</strong> Option {rev.userAnswer !== undefined ? rev.userAnswer + 1 : 'Unanswered'}
                      {!rev.isCorrect && (
                        <span style={{ marginLeft: '12px', color: '#16a34a' }}>
                          <strong>Correct:</strong> Option {rev.correctAnswer + 1}
                        </span>
                      )}
                    </div>
                    {rev.rationale && (
                      <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#475569', fontStyle: 'italic', background: 'rgba(255,255,255,0.6)', padding: '8px', borderRadius: '6px' }}>
                        Explanation: {rev.rationale}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Quiz in progress */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#0f172a' }}>{activeAssessment.title}</h3>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    {activeAssessment.questions.length} questions • Passing score: {activeAssessment.passing_score}%
                  </span>
                </div>
                <button onClick={resetQuiz} className="btn btn-outline btn-sm">
                  Cancel
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {activeAssessment.questions.map((q, qIndex) => (
                  <div key={q.id} style={{ background: '#f8fafc', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontWeight: 600, fontSize: '15px', color: '#1e293b', margin: '0 0 12px 0' }}>
                      {qIndex + 1}. {q.question}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {q.options.map((opt, optIndex) => {
                        const isSelected = answers[q.id] === optIndex;
                        return (
                          <label
                            key={optIndex}
                            onClick={() => handleSelectOption(q.id, optIndex)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px 14px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              background: isSelected ? '#eff6ff' : '#fff',
                              border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                              fontSize: '14px',
                              color: isSelected ? '#1d4ed8' : '#334155',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <input
                              type="radio"
                              name={`q_${q.id}`}
                              checked={isSelected}
                              onChange={() => handleSelectOption(q.id, optIndex)}
                              style={{ cursor: 'pointer' }}
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || Object.keys(answers).length < activeAssessment.questions.length}
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', fontSize: '14px' }}
                >
                  {isSubmitting ? 'Evaluating Answers...' : 'Submit Assessment'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Assessment list view */
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Available Assessments */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 14px 0', color: '#1e293b' }}>
              Available Assessments ({assessments.length})
            </h3>

            {loading ? (
              <div style={{ color: '#64748b' }}>Loading assessments...</div>
            ) : assessments.length === 0 ? (
              <div className="card" style={{ background: '#fff', padding: '30px', textAlign: 'center', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                No assessments available at this time.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {assessments.map(asm => {
                  const pastAttempt = attempts.find(a => a.assessment_id === asm.id);
                  return (
                    <div
                      key={asm.id}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#eff6ff', color: '#2563eb' }}>
                            {asm.category?.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            <Clock size={12} style={{ display: 'inline', marginRight: '3px' }} />
                            {asm.duration_minutes} mins • {asm.question_count} questions
                          </span>
                        </div>
                        <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0', color: '#0f172a' }}>
                          {asm.title}
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{asm.description}</p>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                        {pastAttempt && (
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: pastAttempt.passed ? '#dcfce7' : '#fee2e2',
                              color: pastAttempt.passed ? '#15803d' : '#b91c1c'
                            }}>
                              Score: {pastAttempt.score}% ({pastAttempt.passed ? 'Passed' : 'Failed'})
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() => handleStart(asm.id)}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '12px' }}
                        >
                          {pastAttempt ? 'Retake Test' : 'Start Assessment'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Attempts History */}
          <div>
            <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={18} color="#2563eb" /> Attempt History
              </h3>

              {attempts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: '13px' }}>
                  No completed attempts yet. Take an assessment on the left to benchmark your skills.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {attempts.map(att => (
                    <div key={att.id} style={{ padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{att.title}</span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: att.passed ? '#dcfce7' : '#fee2e2',
                          color: att.passed ? '#15803d' : '#b91c1c'
                        }}>
                          {att.score}%
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                        Completed on {new Date(att.completed_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
