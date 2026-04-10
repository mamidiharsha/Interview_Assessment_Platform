import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, useContext, createContext } from 'react';
import { getMe } from './api';
import LoginPage from './pages/LoginPage';
import InstructionPage from './pages/InstructionPage';
import SectionSelect from './pages/SectionSelect';
import TechnicalAssessment from './pages/TechnicalAssessment';
import CodingAssessment from './pages/CodingAssessment';
import Completed from './pages/Completed';

export const AuthContext = createContext(null);
export const AssessmentContext = createContext(null);

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'candidate') return <Navigate to="/login" replace />;
    return children;
}

function useAuth() {
    const context = useContext(AuthContext);
    return context;
}

function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-950">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-dark-400 text-lg">Loading...</p>
            </div>
        </div>
    );
}

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [assessmentState, setAssessmentState] = useState({
        assessmentId: null,
        submissionId: null,
        submission: null,
        masterTimeLeft: 0,
        technicalTimeLeft: 0,
        codingTimeLeft: 0,
        warningCount: 0,
        isTerminated: false,
    });

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await getMe();
            setUser(res.data.user);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            <AssessmentContext.Provider value={{ assessmentState, setAssessmentState }}>
                <Router>
                    <Routes>
                        <Route path="/login" element={
                            user ? <Navigate to="/instructions" replace /> : <LoginPage />
                        } />
                        <Route path="/instructions" element={
                            <ProtectedRoute><InstructionPage /></ProtectedRoute>
                        } />
                        <Route path="/sections" element={
                            <ProtectedRoute><SectionSelect /></ProtectedRoute>
                        } />
                        <Route path="/assessment/technical" element={
                            <ProtectedRoute><TechnicalAssessment /></ProtectedRoute>
                        } />
                        <Route path="/assessment/coding" element={
                            <ProtectedRoute><CodingAssessment /></ProtectedRoute>
                        } />
                        <Route path="/completed" element={
                            <ProtectedRoute><Completed /></ProtectedRoute>
                        } />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </Router>
            </AssessmentContext.Provider>
        </AuthContext.Provider>
    );
}

export default App;
