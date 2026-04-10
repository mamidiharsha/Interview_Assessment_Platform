import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCandidates } from '../api';

export default function Candidates() {
    const [candidates, setCandidates] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => { loadCandidates(); }, []);

    const loadCandidates = async () => {
        try {
            const res = await getCandidates();
            setCandidates(res.data);
        } catch { } finally { setLoading(false); }
    };

    const filtered = candidates.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Candidates</h1>
                    <p className="text-dark-400 mt-1">{candidates.length} registered candidates</p>
                </div>
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="input-field w-72"
                />
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-dark-700/50">
                            <th className="text-left px-6 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Candidate</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Submissions</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Status</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Score</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Violations</th>
                            <th className="text-right px-6 py-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700/30">
                        {filtered.map(candidate => {
                            const latestSub = candidate.submissions?.[candidate.submissions.length - 1];
                            return (
                                <tr key={candidate._id} className="hover:bg-dark-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold">
                                                {candidate.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">{candidate.name}</p>
                                                <p className="text-dark-500 text-xs">{candidate.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-dark-300 text-sm">{candidate.submissions?.length || 0}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {latestSub ? (
                                            <span className={
                                                latestSub.status === 'completed' ? 'badge-success' :
                                                    latestSub.status === 'terminated' ? 'badge-danger' : 'badge-warning'
                                            }>
                                                {latestSub.status}
                                            </span>
                                        ) : (
                                            <span className="badge bg-dark-700 text-dark-300 border border-dark-600">Not started</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-white font-medium text-sm">
                                            {latestSub?.score?.total ?? '—'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {candidate.violationCount > 0 ? (
                                            <span className="badge-danger">{candidate.violationCount}</span>
                                        ) : (
                                            <span className="text-dark-500 text-sm">0</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => navigate(`/candidates/${candidate._id}`)}
                                            className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
                                        >
                                            View Details →
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-dark-500">No candidates found</div>
                )}
            </div>
        </div>
    );
}
