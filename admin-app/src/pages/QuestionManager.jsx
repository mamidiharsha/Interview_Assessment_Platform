import { useState, useEffect } from 'react';
import { getAssessments, getQuestions, createQuestion, updateQuestion, deleteQuestion } from '../api';

export default function QuestionManager() {
    const [assessments, setAssessments] = useState([]);
    const [selectedAssessment, setSelectedAssessment] = useState('');
    const [section, setSection] = useState('technical');
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        type: 'mcq', section: 'technical', title: '', description: '',
        options: ['', '', '', ''], correctAnswer: 0, points: 5,
        constraints: '', sampleInput: '', sampleOutput: '', testCases: []
    });

    useEffect(() => { loadAssessments(); }, []);
    useEffect(() => { if (selectedAssessment) loadQuestions(); }, [selectedAssessment, section]);

    const loadAssessments = async () => {
        try { const r = await getAssessments(); setAssessments(r.data); if (r.data.length) setSelectedAssessment(r.data[0]._id); }
        catch { } finally { setLoading(false); }
    };

    const loadQuestions = async () => {
        try { const r = await getQuestions(selectedAssessment, section); setQuestions(r.data); } catch { }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const data = { ...form, assessmentId: selectedAssessment, section };
        try {
            if (editing) await updateQuestion(editing, data);
            else await createQuestion(data);
            setShowForm(false); setEditing(null); resetForm(); loadQuestions();
        } catch { }
    };

    const handleEdit = (q) => {
        setForm({
            type: q.type, section: q.section, title: q.title, description: q.description || '',
            options: q.options?.length ? q.options : ['', '', '', ''],
            correctAnswer: q.correctAnswer || 0, points: q.points || 5,
            constraints: q.constraints || '', sampleInput: q.sampleInput || '',
            sampleOutput: q.sampleOutput || '', testCases: q.testCases || []
        });
        setEditing(q._id); setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this question?')) return;
        try { await deleteQuestion(id); loadQuestions(); } catch { }
    };

    const resetForm = () => setForm({
        type: section === 'coding' ? 'coding' : 'mcq', section, title: '', description: '',
        options: ['', '', '', ''], correctAnswer: 0, points: 5,
        constraints: '', sampleInput: '', sampleOutput: '', testCases: []
    });

    const addTestCase = () => setForm({ ...form, testCases: [...form.testCases, { input: '', expectedOutput: '', isHidden: false }] });
    const removeTestCase = (i) => setForm({ ...form, testCases: form.testCases.filter((_, idx) => idx !== i) });

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Question Manager</h1>
                    <p className="text-dark-400 mt-1">Add and manage questions for assessments</p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); setEditing(null); }} className="btn-primary flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Question
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
                <select value={selectedAssessment} onChange={e => setSelectedAssessment(e.target.value)}
                    className="bg-dark-800 text-dark-300 text-sm rounded-xl px-4 py-2.5 border border-dark-600 focus:outline-none focus:ring-1 focus:ring-primary-500">
                    {assessments.map(a => <option key={a._id} value={a._id}>{a.title}</option>)}
                </select>
                <div className="flex bg-dark-900/50 p-1 rounded-xl">
                    {['technical', 'coding'].map(s => (
                        <button key={s} onClick={() => setSection(s)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all
                ${section === s ? 'bg-primary-500/20 text-primary-400' : 'text-dark-400 hover:text-dark-200'}`}>
                            {s}
                        </button>
                    ))}
                </div>
                <span className="text-dark-500 text-sm">{questions.length} questions</span>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-10 overflow-y-auto" onClick={() => setShowForm(false)}>
                    <div className="glass-card p-6 w-full max-w-2xl mx-4 mb-10" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-white mb-6">{editing ? 'Edit Question' : 'Add Question'}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-dark-300 mb-1">Type</label>
                                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-field">
                                        {section === 'technical' ? (
                                            <><option value="mcq">MCQ</option><option value="theory">Theory</option></>
                                        ) : (
                                            <option value="coding">Coding</option>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-dark-300 mb-1">Points</label>
                                    <input type="number" value={form.points} onChange={e => setForm({ ...form, points: parseInt(e.target.value) })} className="input-field" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-dark-300 mb-1">Title</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" required />
                            </div>

                            <div>
                                <label className="block text-sm text-dark-300 mb-1">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" rows={3} />
                            </div>

                            {/* MCQ Options */}
                            {form.type === 'mcq' && (
                                <div>
                                    <label className="block text-sm text-dark-300 mb-2">Options</label>
                                    {form.options.map((opt, i) => (
                                        <div key={i} className="flex items-center gap-2 mb-2">
                                            <input type="radio" name="correctAnswer" checked={form.correctAnswer === i}
                                                onChange={() => setForm({ ...form, correctAnswer: i })} className="w-4 h-4" />
                                            <input value={opt} onChange={e => {
                                                const opts = [...form.options]; opts[i] = e.target.value; setForm({ ...form, options: opts });
                                            }} className="input-field" placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                                        </div>
                                    ))}
                                    <p className="text-xs text-dark-500 mt-1">Select the radio button for the correct answer</p>
                                </div>
                            )}

                            {/* Coding Fields */}
                            {form.type === 'coding' && (
                                <>
                                    <div>
                                        <label className="block text-sm text-dark-300 mb-1">Constraints</label>
                                        <textarea value={form.constraints} onChange={e => setForm({ ...form, constraints: e.target.value })} className="input-field" rows={2} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-dark-300 mb-1">Sample Input</label>
                                            <textarea value={form.sampleInput} onChange={e => setForm({ ...form, sampleInput: e.target.value })} className="input-field font-mono text-sm" rows={3} />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-dark-300 mb-1">Sample Output</label>
                                            <textarea value={form.sampleOutput} onChange={e => setForm({ ...form, sampleOutput: e.target.value })} className="input-field font-mono text-sm" rows={3} />
                                        </div>
                                    </div>

                                    {/* Test Cases */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm text-dark-300">Test Cases</label>
                                            <button type="button" onClick={addTestCase} className="text-xs text-primary-400 hover:text-primary-300">+ Add Test Case</button>
                                        </div>
                                        {form.testCases.map((tc, i) => (
                                            <div key={i} className="bg-dark-800/50 rounded-xl p-3 mb-2 border border-dark-700">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-dark-500">Test Case {i + 1}</span>
                                                    <div className="flex items-center gap-3">
                                                        <label className="flex items-center gap-1.5 text-xs text-dark-400 cursor-pointer">
                                                            <input type="checkbox" checked={tc.isHidden} onChange={e => {
                                                                const tcs = [...form.testCases]; tcs[i].isHidden = e.target.checked; setForm({ ...form, testCases: tcs });
                                                            }} className="w-3 h-3" /> Hidden
                                                        </label>
                                                        <button type="button" onClick={() => removeTestCase(i)} className="text-red-400 text-xs hover:text-red-300">Remove</button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <textarea value={tc.input} onChange={e => {
                                                        const tcs = [...form.testCases]; tcs[i].input = e.target.value; setForm({ ...form, testCases: tcs });
                                                    }} className="input-field font-mono text-xs" placeholder="Input" rows={2} />
                                                    <textarea value={tc.expectedOutput} onChange={e => {
                                                        const tcs = [...form.testCases]; tcs[i].expectedOutput = e.target.value; setForm({ ...form, testCases: tcs });
                                                    }} className="input-field font-mono text-xs" placeholder="Expected Output" rows={2} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
                                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Question List */}
            <div className="space-y-3">
                {questions.map((q, i) => (
                    <div key={q._id} className="glass-card p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-dark-500">Q{i + 1}</span>
                                    <span className={`badge ${q.type === 'mcq' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                        q.type === 'theory' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                            'bg-purple-500/20 text-purple-400 border border-purple-500/30'}`}>{q.type}</span>
                                    <span className="text-xs text-dark-500">{q.points} pts</span>
                                </div>
                                <h4 className="text-white font-medium text-sm">{q.title}</h4>
                                {q.testCases?.length > 0 && (
                                    <span className="text-xs text-dark-500 mt-1">{q.testCases.length} test cases ({q.testCases.filter(t => t.isHidden).length} hidden)</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleEdit(q)} className="text-xs px-3 py-1.5 rounded-lg border border-dark-600 text-dark-300 hover:bg-dark-700 transition-all">Edit</button>
                                <button onClick={() => handleDelete(q._id)} className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
                {questions.length === 0 && (
                    <div className="glass-card p-12 text-center text-dark-500">
                        {selectedAssessment ? 'No questions in this section' : 'Select an assessment'}
                    </div>
                )}
            </div>
        </div>
    );
}
