import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCandidateDetail } from '../api';
import Editor from '@monaco-editor/react';

export default function CandidateDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        loadDetail();
    }, [id]);

    const loadDetail = async () => {
        try {
            const res = await getCandidateDetail(id);
            setData(res.data);
        } catch { } finally { setLoading(false); }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
    );

    if (!data) return <div className="text-dark-500">Candidate not found</div>;

    const { candidate, submissions, violations } = data;
    const latestSub = submissions?.[submissions.length - 1];

    const tabs = ['overview', 'technical', 'coding', 'violations'];

    const formatDate = (d) => d ? new Date(d).toLocaleString() : '—';

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/candidates')} className="text-dark-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xl font-bold">
                        {candidate.name.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{candidate.name}</h1>
                        <p className="text-dark-400">{candidate.email}</p>
                    </div>
                </div>
                {latestSub && (
                    <span className={`ml-auto ${latestSub.status === 'completed' ? 'badge-success' :
                            latestSub.status === 'terminated' ? 'badge-danger' : 'badge-warning'
                        }`}>
                        {latestSub.status}
                    </span>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-dark-900/50 p-1 rounded-xl w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
              ${activeTab === tab
                                ? 'bg-primary-500/20 text-primary-400'
                                : 'text-dark-400 hover:text-dark-200'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && latestSub && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Assessment Info</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-dark-400">Assessment</span><span className="text-white">{latestSub.assessmentId?.title || 'N/A'}</span></div>
                            <div className="flex justify-between"><span className="text-dark-400">Status</span><span className="text-white">{latestSub.status}</span></div>
                            <div className="flex justify-between"><span className="text-dark-400">Started</span><span className="text-white">{formatDate(latestSub.startTime)}</span></div>
                            <div className="flex justify-between"><span className="text-dark-400">Ended</span><span className="text-white">{formatDate(latestSub.endTime)}</span></div>
                        </div>
                    </div>
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Scores</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-dark-400">Technical</span>
                                    <span className="text-white font-medium">{latestSub.score?.technical || 0}</span>
                                </div>
                                <div className="h-2 bg-dark-700 rounded-full"><div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: `${Math.min(100, (latestSub.score?.technical || 0) * 2)}%` }}></div></div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-dark-400">Coding</span>
                                    <span className="text-white font-medium">{latestSub.score?.coding || 0}</span>
                                </div>
                                <div className="h-2 bg-dark-700 rounded-full"><div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${Math.min(100, (latestSub.score?.coding || 0) * 2)}%` }}></div></div>
                            </div>
                            <div className="pt-2 border-t border-dark-700">
                                <div className="flex justify-between">
                                    <span className="text-dark-300 font-medium">Total Score</span>
                                    <span className="text-xl font-bold text-white">{latestSub.score?.total || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Technical Answers Tab */}
            {activeTab === 'technical' && latestSub && (
                <div className="space-y-4">
                    {latestSub.questions?.filter(q => q.section === 'technical').map((q, i) => {
                        const answer = latestSub.technicalAnswers?.[q._id];
                        const isCorrect = q.type === 'mcq' && answer === q.correctAnswer;
                        return (
                            <div key={q._id} className="glass-card p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="badge-info">Q{i + 1}</span>
                                    <span className={`badge ${q.type === 'mcq' ? 'bg-dark-700 text-dark-300 border border-dark-600' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>{q.type.toUpperCase()}</span>
                                    {q.type === 'mcq' && answer !== undefined && (
                                        <span className={isCorrect ? 'badge-success' : 'badge-danger'}>
                                            {isCorrect ? 'Correct' : 'Wrong'}
                                        </span>
                                    )}
                                </div>
                                <h4 className="text-white font-medium mb-2">{q.title}</h4>
                                <p className="text-sm text-dark-400 mb-3">{q.description}</p>
                                {q.type === 'mcq' ? (
                                    <div className="space-y-2">
                                        {q.options?.map((opt, oi) => (
                                            <div key={oi} className={`text-sm px-3 py-2 rounded-lg border
                        ${oi === q.correctAnswer ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' :
                                                    oi === answer && oi !== q.correctAnswer ? 'border-red-500/40 bg-red-500/10 text-red-400' :
                                                        'border-dark-700 text-dark-400'}`}>
                                                {String.fromCharCode(65 + oi)}. {opt}
                                                {oi === q.correctAnswer && ' ✓'}
                                                {oi === answer && oi !== q.correctAnswer && ' ✗ (Selected)'}
                                                {oi === answer && oi === q.correctAnswer && ' (Selected)'}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-dark-800 rounded-lg p-3 text-sm text-dark-300">
                                        {answer || <span className="text-dark-500 italic">No answer provided</span>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Coding Answers Tab */}
            {activeTab === 'coding' && latestSub && (
                <div className="space-y-6">
                    {latestSub.codingAnswers?.map((ca, i) => {
                        const question = latestSub.questions?.find(q => q._id === ca.questionId);
                        return (
                            <div key={i} className="glass-card overflow-hidden">
                                <div className="p-5 border-b border-dark-700/50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-white font-medium">{question?.title || `Problem ${i + 1}`}</h4>
                                            <span className="text-xs text-dark-500 mt-1">Language: {ca.language}</span>
                                        </div>
                                        {ca.results && (
                                            <div className="flex items-center gap-3">
                                                <span className="badge-success">{ca.results.passed} Passed</span>
                                                <span className="badge-danger">{ca.results.failed} Failed</span>
                                                {ca.results.executionTime > 0 && (
                                                    <span className="text-xs text-dark-500">{ca.results.executionTime}ms</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="h-64">
                                    <Editor
                                        height="100%"
                                        language={ca.language === 'cpp' ? 'cpp' : ca.language}
                                        value={ca.code || '// No code submitted'}
                                        theme="vs-dark"
                                        options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", scrollBeyondLastLine: false }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                    {(!latestSub.codingAnswers || latestSub.codingAnswers.length === 0) && (
                        <div className="text-center py-12 text-dark-500">No coding submissions</div>
                    )}
                </div>
            )}

            {/* Violations Tab */}
            {activeTab === 'violations' && (
                <div className="space-y-3">
                    {violations.length === 0 ? (
                        <div className="glass-card p-8 text-center text-dark-500">No violations recorded</div>
                    ) : violations.map((v, i) => (
                        <div key={i} className="glass-card p-4 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="badge-danger">{v.type}</span>
                                    <span className="text-xs text-dark-500">{formatDate(v.timestamp)}</span>
                                </div>
                                <p className="text-sm text-dark-300">{v.details}</p>
                            </div>
                            {v.snapshot && (
                                <img src={v.snapshot} alt="Snapshot" className="w-20 h-15 rounded-lg object-cover border border-dark-600" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
