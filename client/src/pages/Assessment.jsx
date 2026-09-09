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
  ShieldCheck 
} from 'lucide-react';

export default function Assessment() {
  const { user, updateUser } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedStream, setSelectedStream] = useState(user?.stream || 'ayurveda');

  useEffect(() => {
    async function loadAssessments() {
      setLoading(true);
      try {
        const list = await assessmentService.getAll();
        setAssessments(list);
      } catch (err) {
        console.error("Error loading assessments:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAssessments();
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
      // Refresh user's badges in AuthContext
      if (res.passed) {
        const currentScores = user?.assessmentScores || [];
        const newScore = {
          stream: activeAssessment.stream,
          title: activeAssessment.title,
          score: res.score,
          passed: true,
          badge: res.badge,
          completedAt: new Date().toISOString()
        };
        updateUser({ assessmentScores: [newScore, ...currentScores] });
      }
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setActiveAssessment(null);
    setAnswers({});
    setResult(null);
  };

  const filteredAssessments = assessments.filter(
    a => !selectedStream || a.stream === selectedStream
  );

  return (
    <div className="dashboard-container">
      <div className="page-header-row">
        <div>
          <h2>Ministry Standardized Ayush Skill Assessments</h2>
          <p className="page-subtitle">
            Validate your clinical acumen, classical pharmacognosy, and protocol diagnostic standards to earn verified digital credentials.
          </p>
        </div>
      </div>

      {/* If taking an assessment */}
      {activeAssessment ? (
        <div className="assessment-active-wrapper">
          <div className="quiz-header-card">
            <div className="quiz-title-box">
              <span className="quiz-stream-tag">{activeAssessment.stream.toUpperCase()}</span>
              <h3>{activeAssessment.title}</h3>
              <p>{activeAssessment.description}</p>
            </div>
            <div className="quiz-meta-box">
              <div className="meta-pill">
                <Clock size={16} />
                <span>{activeAssessment.durationMinutes} Minutes</span>
              </div>
              <div className="meta-pill">
                <Award size={16} />
                <span>Passing: {activeAssessment.passingScore}%</span>
              </div>
              <button onClick={resetQuiz} className="btn btn-outline btn-sm">
                Exit Assessment
              </button>
            </div>
          </div>

          {/* Results Screen */}
          {result ? (
            <div className="quiz-result-card">
              <div className={`result-hero ${result.passed ? 'pass' : 'fail'}`}>
                <div className="result-score-circle">
                  <span className="score-number">{result.score}%</span>
                  <span className="score-label">Final Score</span>
                </div>
                <div className="result-hero-text">
                  <h3>{result.passed ? "Assessment Passed!" : "Needs Improvement"}</h3>
                  <p>
                    You answered {result.correctCount} out of {result.totalQuestions} questions correctly.
                  </p>
                  {result.passed ? (
                    <div className="certificate-badge-box">
                      <ShieldCheck size={24} className="gold-icon" />
                      <div>
                        <strong>Credential Issued: {result.badge}</strong>
                        <p>This badge is now visible on your profile to top Ayush recruiters.</p>
                      </div>
                    </div>
                  ) : (
                    <p className="fail-advice">Review classical Ayush literature and re-attempt to earn certification.</p>
                  )}
                  <div className="result-actions">
                    <button onClick={resetQuiz} className="btn btn-primary">
                      Back to Assessments
                    </button>
                  </div>
                </div>
              </div>

              {/* Detailed Review */}
              <div className="quiz-review-section">
                <h4>Detailed Question Review & Classical Rationale</h4>
                <div className="review-list">
                  {result.review.map((item, idx) => (
                    <div key={item.id} className={`review-card ${item.isCorrect ? 'correct' : 'incorrect'}`}>
                      <div className="review-card-top">
                        <span className="question-idx">Question {idx + 1}</span>
                        {item.isCorrect ? (
                          <span className="review-status-tag correct"><CheckCircle size={14} /> Correct</span>
                        ) : (
                          <span className="review-status-tag incorrect"><XCircle size={14} /> Incorrect</span>
                        )}
                      </div>
                      <p className="review-question">{item.question}</p>
                      <div className="review-rationale">
                        <BookOpen size={16} className="green-icon" />
                        <div>
                          <strong>Authoritative Ayush Reference:</strong>
                          <p>{item.rationale}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Questions List */
            <div className="questions-container">
              {activeAssessment.questions.map((q, idx) => (
                <div key={q.id} className="question-card">
                  <div className="question-number">Question {idx + 1} of {activeAssessment.questions.length}</div>
                  <h4 className="question-text">{q.question}</h4>

                  <div className="options-grid">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = answers[q.id] === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`option-box ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                        >
                          <div className="option-radio">
                            {isSelected && <div className="radio-dot"></div>}
                          </div>
                          <span className="option-text">{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="quiz-submit-footer">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || Object.keys(answers).length < activeAssessment.questions.length}
                  className="btn btn-primary btn-lg"
                >
                  {isSubmitting ? "Evaluating Responses..." : "Submit Assessment for Certification"}
                  <ArrowRight size={18} />
                </button>
                {Object.keys(answers).length < activeAssessment.questions.length && (
                  <span className="unanswered-warning">
                    Please answer all {activeAssessment.questions.length} questions before submitting. ({Object.keys(answers).length}/{activeAssessment.questions.length} completed)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Assessment Catalog */
        <div className="assessment-catalog">
          {/* Stream Filter Pills */}
          <div className="stream-filter-tabs">
            {['ayurveda', 'yoga_naturopathy', 'homeopathy'].map(st => (
              <button
                key={st}
                className={`stream-tab ${selectedStream === st ? 'active' : ''}`}
                onClick={() => setSelectedStream(st)}
              >
                {st === 'ayurveda' ? 'Ayurveda' : st === 'yoga_naturopathy' ? 'Yoga & Naturopathy' : 'Homeopathy'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="skeleton-loader">Loading accredited assessments...</div>
          ) : (
            <div className="assessment-cards-grid">
              {filteredAssessments.map(asm => (
                <div key={asm.id} className="assessment-item-card">
                  <div className="item-card-top">
                    <span className="asm-badge">{asm.stream.replace('_', ' ').toUpperCase()}</span>
                    <div className="asm-duration">
                      <Clock size={14} /> {asm.durationMinutes} mins
                    </div>
                  </div>

                  <h4>{asm.title}</h4>
                  <p>{asm.description}</p>

                  <div className="asm-stats-row">
                    <span>Questions: <strong>{asm.questionCount} Questions</strong></span>
                    <span>Passing Benchmark: <strong>{asm.passingScore}%</strong></span>
                  </div>

                  <div className="asm-footer">
                    <button onClick={() => handleStart(asm.id)} className="btn btn-primary btn-block">
                      <Sparkles size={16} /> Begin Assessment Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
