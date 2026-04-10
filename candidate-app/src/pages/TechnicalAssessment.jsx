import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssessmentContext } from '../App';
import { getQuestions, saveTechnicalAnswer, toggleReview, syncTimer, submitAssessment } from '../api';
import TopBar from '../components/TopBar';

export default function TechnicalAssessment() {
    const { assessmentState, setAssessmentState } = useContext(AssessmentContext);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [markedForReview, setMarkedForReview] = useState(new Set());
    const [sectionTimer, setSectionTimer] = useState(assessmentState.technicalTimeLeft);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const timerRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!assessmentState.submissionId) {
            navigate('/instructions');
            return;
        }
        loadQuestions();
        return () => clearInterval(timerRef.current);
    }, []);

    useEffect(() => {
        if (questions.length === 0) return;
        timerRef.current = setInterval(() => {
            setSectionTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleSectionSubmit(true);
                    return 0;
                }
                if (prev % 30 === 0) {
                    syncTimer(assessmentState.submissionId, { remainingTechnicalTime: prev - 1 }).catch(() => { });
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [questions]);

    const loadQuestions = async () => {
        try {
            const res = await getQuestions(assessmentState.assessmentId, 'technical');
            setQuestions(res.data);
            // Restore saved answers from submission
            if (assessmentState.submission?.technicalAnswers) {
                const saved = {};
                const entries = assessmentState.submission.technicalAnswers;
                if (entries instanceof Map) {
                    entries.forEach((v, k) => { saved[k] = v; });
                } else if (typeof entries === 'object') {
                    Object.assign(saved, entries);
                }
                setAnswers(saved);
            }
            if (assessmentState.submission?.markedForReview) {
                setMarkedForReview(new Set(assessmentState.submission.markedForReview));
            }
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = async (questionId, answer) => {
        const newAnswers = { ...answers, [questionId]: answer };
        setAnswers(newAnswers);
        try {
            await saveTechnicalAnswer(assessmentState.submissionId, questionId, answer);
        } catch { }
    };

    const handleToggleReview = async (questionId) => {
        const newMarked = new Set(markedForReview);
        if (newMarked.has(questionId)) newMarked.delete(questionId);
        else newMarked.add(questionId);
        setMarkedForReview(newMarked);
        try {
            await toggleReview(assessmentState.submissionId, questionId);
        } catch { }
    };

    const handleSectionSubmit = async (auto = false) => {
        setSubmitting(true);
        clearInterval(timerRef.current);
        setAssessmentState(prev => ({
            ...prev,
            technicalTimeLeft: 0,
        }));
        navigate('/sections');
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const currentQuestion = questions[currentIndex];
    const answeredCount = Object.keys(answers).length;
    const reviewCount = markedForReview.size;

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-950">
            <TopBar />
            <div className="pt-16 flex h-screen">
                {/* Question Navigation Panel (Left Sidebar) */}
                <div className="w-64 bg-dark-900/50 border-r border-dark-700/50 flex flex-col overflow-hidden">
                    {/* Section Timer */}
                    <div className="p-4 border-b border-dark-700/50">
                        <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl ${sectionTimer < 300 ? 'bg-red-500/20 border border-red-500/30' : 'bg-dark-800 border border-dark-700'
                            }`}>
                            <svg className={`w-4 h-4 ${sectionTimer < 300 ? 'text-red-400' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className={`font-mono font-bold ${sectionTimer < 300 ? 'text-red-400' : 'text-white'}`}>
                                {formatTime(sectionTimer)}
                            </span>
                        </div>
                        <p className="text-xs text-dark-500 text-center mt-2">Section Timer</p>
                    </div>

                    {/* Legend */}
                    <div className="p-4 border-b border-dark-700/50">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                                <span className="text-dark-400">Answered ({answeredCount})</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-sm bg-dark-600"></span>
                                <span className="text-dark-400">Unanswered</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-sm bg-amber-500"></span>
                                <span className="text-dark-400">Review ({reviewCount})</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-sm ring-2 ring-primary-500 bg-dark-700"></span>
                                <span className="text-dark-400">Current</span>
                            </div>
                        </div>
                    </div>

                    {/* Question Palette */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-4 gap-2">
                            {questions.map((q, i) => {
                                const isAnswered = answers[q._id] !== undefined;
                                const isReview = markedForReview.has(q._id);
                                const isCurrent = i === currentIndex;
                                return (
                                    <button
                                        key={q._id}
                                        onClick={() => setCurrentIndex(i)}
                                        className={`w-full aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all
                      ${isCurrent ? 'ring-2 ring-primary-500 scale-110' : ''}
                      ${isReview ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' :
                                                isAnswered ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' :
                                                    'bg-dark-700 text-dark-400 border border-dark-600 hover:bg-dark-600'}`}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Submit Section Button */}
                    <div className="p-4 border-t border-dark-700/50">
                        <button onClick={() => handleSectionSubmit(false)} disabled={submitting}
                            className="btn-primary w-full text-sm">
                            {submitting ? 'Saving...' : 'Finish Section'}
                        </button>
                    </div>
                </div>

                {/* Main Question Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {currentQuestion && (
                        <div className="max-w-3xl mx-auto">
                            {/* Question Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="badge-info">Question {currentIndex + 1} of {questions.length}</span>
                                    <span className="badge bg-dark-700 text-dark-300 border border-dark-600">
                                        {currentQuestion.type === 'mcq' ? 'MCQ' : 'Theory'}
                                    </span>
                                    <span className="text-xs text-dark-500">{currentQuestion.points} pts</span>
                                </div>
                                <button
                                    onClick={() => handleToggleReview(currentQuestion._id)}
                                    className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all
                    ${markedForReview.has(currentQuestion._id)
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            : 'bg-dark-700 text-dark-400 border border-dark-600 hover:bg-dark-600'}`}
                                >
                                    <svg className="w-4 h-4" fill={markedForReview.has(currentQuestion._id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                    {markedForReview.has(currentQuestion._id) ? 'Marked' : 'Mark for Review'}
                                </button>
                            </div>

                            {/* Question Content */}
                            <div className="glass-card p-6 mb-6">
                                <h2 className="text-xl font-semibold text-white mb-3">{currentQuestion.title}</h2>
                                <p className="text-dark-300 leading-relaxed whitespace-pre-wrap">{currentQuestion.description}</p>
                            </div>

                            {/* Answer Section */}
                            {currentQuestion.type === 'mcq' ? (
                                <div className="space-y-3">
                                    {currentQuestion.options.map((option, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleAnswer(currentQuestion._id, i)}
                                            className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4
                        ${answers[currentQuestion._id] === i
                                                    ? 'border-primary-500 bg-primary-500/10 text-white'
                                                    : 'border-dark-700 bg-dark-800/50 text-dark-300 hover:border-dark-500 hover:bg-dark-800'}`}
                                        >
                                            <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                        ${answers[currentQuestion._id] === i
                                                    ? 'bg-primary-500 text-white'
                                                    : 'bg-dark-700 text-dark-400'}`}>
                                                {String.fromCharCode(65 + i)}
                                            </span>
                                            <span>{option}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div>
                                    <textarea
                                        value={answers[currentQuestion._id] || ''}
                                        onChange={(e) => handleAnswer(currentQuestion._id, e.target.value)}
                                        className="input-field min-h-[200px] resize-y"
                                        placeholder="Type your answer here..."
                                    />
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex items-center justify-between mt-8">
                                <button
                                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                                    disabled={currentIndex === 0}
                                    className="btn-secondary flex items-center gap-2 disabled:opacity-30"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Previous
                                </button>

                                {currentIndex < questions.length - 1 ? (
                                    <button
                                        onClick={() => setCurrentIndex(currentIndex + 1)}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        Save & Next
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                ) : (
                                    <button onClick={() => handleSectionSubmit(false)} className="btn-primary">
                                        Finish Section
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
