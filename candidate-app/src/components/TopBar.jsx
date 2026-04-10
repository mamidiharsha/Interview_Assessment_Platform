import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, AssessmentContext } from '../App';
import { syncTimer, submitAssessment, logViolation, logout } from '../api';

export default function TopBar() {
    const { user, setUser } = useContext(AuthContext);
    const { assessmentState, setAssessmentState } = useContext(AssessmentContext);
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const timerRef = useRef(null);

    // Master timer countdown
    useEffect(() => {
        if (!assessmentState.submissionId) return;

        timerRef.current = setInterval(() => {
            setAssessmentState(prev => {
                const newTime = prev.masterTimeLeft - 1;
                if (newTime <= 0) {
                    clearInterval(timerRef.current);
                    handleAutoSubmit();
                    return { ...prev, masterTimeLeft: 0 };
                }
                // Sync timer to backend every 30 seconds
                if (newTime % 30 === 0) {
                    syncTimer(prev.submissionId, { remainingMasterTime: newTime }).catch(() => { });
                }
                return { ...prev, masterTimeLeft: newTime };
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [assessmentState.submissionId]);

    // Webcam preview
    useEffect(() => {
        initCamera();
    }, []);

    // Anti-cheat: Tab switch detection
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden && assessmentState.submissionId) {
                handleViolation('tab-switch', 'Candidate switched tabs');
            }
        };

        const handleBlur = () => {
            if (assessmentState.submissionId) {
                handleViolation('tab-switch', 'Window lost focus');
            }
        };

        // Disable copy/paste/right-click
        const preventCopy = (e) => e.preventDefault();
        const preventPaste = (e) => e.preventDefault();
        const preventContext = (e) => e.preventDefault();

        // DevTools detection
        const detectDevTools = (e) => {
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                (e.ctrlKey && e.key === 'u')
            ) {
                e.preventDefault();
                handleViolation('devtools', 'DevTools shortcut detected');
            }
        };

        // Fullscreen exit detection
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && assessmentState.submissionId) {
                handleViolation('fullscreen-exit', 'Exited fullscreen mode');
                try { document.documentElement.requestFullscreen(); } catch { }
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('copy', preventCopy);
        document.addEventListener('paste', preventPaste);
        document.addEventListener('contextmenu', preventContext);
        document.addEventListener('keydown', detectDevTools);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('copy', preventCopy);
            document.removeEventListener('paste', preventPaste);
            document.removeEventListener('contextmenu', preventContext);
            document.removeEventListener('keydown', detectDevTools);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [assessmentState.submissionId, assessmentState.warningCount]);

    const initCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch { }
    };

    const handleViolation = async (type, details) => {
        const newCount = assessmentState.warningCount + 1;
        setAssessmentState(prev => ({ ...prev, warningCount: newCount }));

        // Capture snapshot
        let snapshot = '';
        if (videoRef.current) {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
                snapshot = canvas.toDataURL('image/jpeg', 0.5);
            } catch { }
        }

        try {
            await logViolation({
                assessmentId: assessmentState.assessmentId,
                submissionId: assessmentState.submissionId,
                type,
                details,
                snapshot
            });
        } catch { }

        if (newCount >= 3) {
            handleTerminate();
        }
    };

    const handleAutoSubmit = async () => {
        try {
            await submitAssessment(assessmentState.submissionId, 'timeout');
            navigate('/completed');
        } catch { }
    };

    const handleTerminate = async () => {
        setAssessmentState(prev => ({ ...prev, isTerminated: true }));
        try {
            await submitAssessment(assessmentState.submissionId, 'terminated');
        } catch { }
        try { document.exitFullscreen(); } catch { }
        navigate('/completed');
    };

    const handleLogout = async () => {
        try {
            await logout();
            setUser(null);
            navigate('/login');
        } catch { }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const isUrgent = assessmentState.masterTimeLeft < 300;

    return (
        <>
            {/* Warning Popup */}
            {assessmentState.warningCount > 0 && assessmentState.warningCount < 3 && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
                    onClick={() => setAssessmentState(prev => ({ ...prev }))}>
                    <div className="glass-card p-8 max-w-md mx-4 border-amber-500/30">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Warning {assessmentState.warningCount}/3</h3>
                            <p className="text-dark-400 mb-6">A violation was detected. {3 - assessmentState.warningCount} more violation(s) will terminate your assessment.</p>
                            <button onClick={() => {
                                // Dismiss by re-entering fullscreen
                                try { document.documentElement.requestFullscreen(); } catch { }
                            }} className="btn-primary">
                                I Understand
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Bar */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50 z-40 flex items-center justify-between px-4">
                {/* Left: Timer */}
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isUrgent
                        ? 'bg-red-500/20 border border-red-500/30 animate-pulse'
                        : 'bg-dark-800 border border-dark-700'}`}>
                        <svg className={`w-4 h-4 ${isUrgent ? 'text-red-400' : 'text-primary-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={`font-mono font-bold text-lg ${isUrgent ? 'text-red-400' : 'text-white'}`}>
                            {formatTime(assessmentState.masterTimeLeft)}
                        </span>
                    </div>
                </div>

                {/* Center: Title */}
                <div className="hidden md:block text-center">
                    <span className="text-sm font-medium text-dark-400">Assessment Platform</span>
                </div>

                {/* Right: Camera, Warnings, Profile */}
                <div className="flex items-center gap-3">
                    {/* Warning counter */}
                    {assessmentState.warningCount > 0 && (
                        <div className="badge-danger">
                            ⚠ {assessmentState.warningCount}/3
                        </div>
                    )}

                    {/* Camera preview */}
                    <div className="relative">
                        <video ref={videoRef} autoPlay muted playsInline
                            className="w-12 h-9 rounded-lg object-cover border border-dark-600" />
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                    </div>

                    {/* Profile */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
