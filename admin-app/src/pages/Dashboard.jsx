import { useState, useEffect } from 'react';
import { getDashboard, exportResults } from '../api';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const res = await getDashboard();
            setStats(res.data);
        } catch { } finally { setLoading(false); }
    };

    const handleExport = async () => {
        try {
            const res = await exportResults();
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'assessment-results.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch { }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
    );

    const statCards = [
        { label: 'Total Candidates', value: stats?.totalCandidates || 0, icon: '👥', color: 'from-blue-500 to-cyan-500' },
        { label: 'Completed', value: stats?.completedSubmissions || 0, icon: '✅', color: 'from-emerald-500 to-green-500' },
        { label: 'Terminated', value: stats?.terminatedSubmissions || 0, icon: '🚫', color: 'from-red-500 to-rose-500' },
        { label: 'In Progress', value: stats?.inProgressSubmissions || 0, icon: '⏳', color: 'from-amber-500 to-orange-500' },
        { label: 'Avg Score', value: stats?.avgScore || 0, icon: '📊', color: 'from-purple-500 to-pink-500' },
        { label: 'Total Violations', value: stats?.totalViolations || 0, icon: '⚠️', color: 'from-rose-500 to-red-600' },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
                    <p className="text-dark-400 mt-1">Monitor assessment performance and candidate activity</p>
                </div>
                <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {statCards.map((card, i) => (
                    <div key={i} className="stat-card group hover:border-dark-600 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-2xl">{card.icon}</span>
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${card.color}`}></div>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
                        <p className="text-sm text-dark-400">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Section Breakdown */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Section Averages</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-dark-400">Technical</span>
                                <span className="text-white font-medium">{stats?.avgTechnical || 0} pts</span>
                            </div>
                            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, (stats?.avgTechnical || 0) * 2)}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-dark-400">Coding</span>
                                <span className="text-white font-medium">{stats?.avgCoding || 0} pts</span>
                            </div>
                            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, (stats?.avgCoding || 0) * 2)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Submission Status</h3>
                    <div className="space-y-3">
                        {[
                            { label: 'Completed', value: stats?.completedSubmissions, total: stats?.totalSubmissions, color: 'bg-emerald-500' },
                            { label: 'Terminated', value: stats?.terminatedSubmissions, total: stats?.totalSubmissions, color: 'bg-red-500' },
                            { label: 'In Progress', value: stats?.inProgressSubmissions, total: stats?.totalSubmissions, color: 'bg-amber-500' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                                    <span className="text-sm text-dark-300">{item.label}</span>
                                </div>
                                <span className="text-sm text-white font-medium">{item.value || 0}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
