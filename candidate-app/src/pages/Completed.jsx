import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, AssessmentContext } from '../App';
import { logout } from '../api';

export default function Completed() {
    const { user, setUser } = useContext(AuthContext);
    const { assessmentState } = useContext(AssessmentContext);
    const navigate = useNavigate();

    useEffect(() => {
        // Exit fullscreen
        try { document.exitFullscreen(); } catch { }
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            setUser(null);
            navigate('/login');
        } catch { }
    };

    return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
            <div className="glass-card max-w-lg w-full p-8 text-center">
                {assessmentState.isTerminated ? (
                    <>
                        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-3">Assessment Terminated</h1>
                        <p className="text-dark-400 mb-8">
                            Your assessment has been terminated due to multiple violations.
                            Your responses have been saved and will be reviewed by the administrator.
                        </p>
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-3">Assessment Submitted</h1>
                        <p className="text-dark-400 mb-8">
                            Thank you for completing the assessment, <span className="text-primary-400">{user?.name}</span>.
                            Your responses have been saved successfully. You will be notified of the results.
                        </p>
                    </>
                )}

                <button onClick={handleLogout} className="btn-secondary">
                    Sign Out
                </button>
            </div>
        </div>
    );
}
