import { useState, useEffect } from 'react';
import { getAssessments, createAssessment, updateAssessment, toggleAssessment, deleteAssessment } from '../api';

export default function AssessmentManager() {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        title: '', description: '', technicalTimer: 1800, codingTimer: 2700, masterTimer: 5400
    });

    useEffect(() => { load(); }, []);

    const load = async () => {
        try { const r = await getAssessments(); setAssessments(r.data); } catch { } finally { setLoading(false); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await updateAssessment(editing, form);
            } else {
                await createAssessment(form);
            }
            setShowForm(false);
            setEditing(null);
            setForm({ title: '', description: '', technicalTimer: 1800, codingTimer: 2700, masterTimer: 5400 });
            load();
        } catch { }
    };

    const handleEdit = (a) => {
        setForm({ title: a.title, description: a.description, technicalTimer: a.technicalTimer, codingTimer: a.codingTimer, masterTimer: a.masterTimer });
        setEditing(a._id);
        setShowForm(true);
    };

    const handleToggle = async (id) => {
        try { await toggleAssessment(id); load(); } catch { }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this assessment?')) return;
        try { await deleteAssessment(id); load(); } catch { }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Assessment Manager</h1>
                    <p className="text-dark-400 mt-1">Create and manage assessments</p>
                </div>
                <button onClick={() => { setShowForm(true); setEditing(null); setForm({ title: '', description: '', technicalTimer: 1800, codingTimer: 2700, masterTimer: 5400 }); }}
                    className="btn-primary flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Assessment
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowForm(false)}>
                    <div className="glass-card p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-white mb-6">{editing ? 'Edit Assessment' : 'Create Assessment'}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm text-dark-300 mb-1">Title</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" required />
                            </div>
                            <div>
                                <label className="block text-sm text-dark-300 mb-1">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" rows={3} />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-sm text-dark-300 mb-1">Technical Timer (sec)</label>
                                    <input type="number" value={form.technicalTimer} onChange={e => setForm({ ...form, technicalTimer: parseInt(e.target.value) })} className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm text-dark-300 mb-1">Coding Timer (sec)</label>
                                    <input type="number" value={form.codingTimer} onChange={e => setForm({ ...form, codingTimer: parseInt(e.target.value) })} className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm text-dark-300 mb-1">Master Timer (sec)</label>
                                    <input type="number" value={form.masterTimer} onChange={e => setForm({ ...form, masterTimer: parseInt(e.target.value) })} className="input-field" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
                                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assessment Cards */}
            <div className="grid gap-4">
                {assessments.map(a => (
                    <div key={a._id} className="glass-card p-5 flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-white font-semibold">{a.title}</h3>
                                <span className={a.isActive ? 'badge-success' : 'badge bg-dark-700 text-dark-400 border border-dark-600'}>
                                    {a.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className="text-sm text-dark-400 mb-2">{a.description}</p>
                            <div className="flex gap-4 text-xs text-dark-500">
                                <span>Technical: {Math.floor(a.technicalTimer / 60)}m</span>
                                <span>Coding: {Math.floor(a.codingTimer / 60)}m</span>
                                <span>Master: {Math.floor(a.masterTimer / 60)}m</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleToggle(a._id)}
                                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${a.isActive
                                    ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                                    : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}>
                                {a.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button onClick={() => handleEdit(a)} className="text-xs px-3 py-1.5 rounded-lg border border-dark-600 text-dark-300 hover:bg-dark-700 transition-all">
                                Edit
                            </button>
                            <button onClick={() => handleDelete(a._id)} className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
                {assessments.length === 0 && (
                    <div className="glass-card p-12 text-center text-dark-500">No assessments created yet</div>
                )}
            </div>
        </div>
    );
}
