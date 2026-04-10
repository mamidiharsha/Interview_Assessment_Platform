import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { getMe, logout } from './api';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import CandidateDetail from './pages/CandidateDetail';
import AssessmentManager from './pages/AssessmentManager';
import QuestionManager from './pages/QuestionManager';

export const AuthContext = createContext(null);

function AdminLayout({ children }) {
    const { user, setUser } = useContext(AuthContext);

    const handleLogout = async () => {
        try { await logout(); } catch { }
        setUser(null);
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
        { path: '/candidates', label: 'Candidates', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
        { path: '/assessments', label: 'Assessments', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
        { path: '/questions', label: 'Questions', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    ];

    return (
        <div className="min-h-screen bg-dark-950 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-dark-900/50 border-r border-dark-700/50 flex flex-col fixed h-full">
                {/* Logo */}
                <div className="p-5 border-b border-dark-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Admin Panel</p>
                            <p className="text-dark-500 text-xs">Assessment Platform</p>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${isActive
                                    ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                                    : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'}`
                            }
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* User */}
                <div className="p-4 border-t border-dark-700/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">{user?.name}</p>
                                <p className="text-xs text-dark-500">{user?.email}</p>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="text-dark-400 hover:text-red-400 transition-colors" title="Logout">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 ml-64 p-6">
                {children}
            </main>
        </div>
    );
}

function ProtectedRoute({ children }) {
    const { user, loading } = useContext(AuthContext);
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-dark-950">
            <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
    );
    if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;
    return <AdminLayout>{children}</AdminLayout>;
}

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await getMe();
                setUser(res.data.user);
            } catch { setUser(null); }
            finally { setLoading(false); }
        })();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            <Router>
                <Routes>
                    <Route path="/login" element={user && user.role === 'admin' ? <Navigate to="/dashboard" /> : <LoginPage />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/candidates" element={<ProtectedRoute><Candidates /></ProtectedRoute>} />
                    <Route path="/candidates/:id" element={<ProtectedRoute><CandidateDetail /></ProtectedRoute>} />
                    <Route path="/assessments" element={<ProtectedRoute><AssessmentManager /></ProtectedRoute>} />
                    <Route path="/questions" element={<ProtectedRoute><QuestionManager /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Router>
        </AuthContext.Provider>
    );
}

export default App;
