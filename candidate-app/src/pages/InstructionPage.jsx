import { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAssessments, startSubmission } from '../api';
import { AuthContext, AssessmentContext } from '../App';

export default function InstructionPage() {
    const [assessments, setAssessments] = useState([]);
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [cameraConsent, setCameraConsent] = useState(false);
    const [micConsent, setMicConsent] = useState(false);
    const [rulesAccepted, setRulesAccepted] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [micReady, setMicReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { setAssessmentState } = useContext(AssessmentContext);

    useEffect(() => {
        loadAssessments();
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    const loadAssessments = async () => {
        try {
            const res = await getAssessments();
            setAssessments(res.data);
            if (res.data.length > 0) setSelectedAssessment(res.data[0]);
        } catch {
            setError('Failed to load assessments');
        }
    };

    const requestCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraReady(true);
        } catch {
            setError('Camera access denied. Camera is required for proctoring.');
        }
    };

    const requestMic = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Add audio tracks to existing stream or create new
            if (streamRef.current) {
                stream.getAudioTracks().forEach(t => streamRef.current.addTrack(t));
            }
            setMicReady(true);
        } catch {
            setError('Microphone access denied. Microphone is required for proctoring.');
        }
    };

    const handleStart = async () => {
        if (!selectedAssessment) return;
        setLoading(true);
        try {
            const res = await startSubmission(selectedAssessment._id);
            setAssessmentState({
                assessmentId: selectedAssessment._id,
                submissionId: res.data._id,
                submission: res.data,
                masterTimeLeft: res.data.remainingMasterTime || selectedAssessment.masterTimer,
                technicalTimeLeft: res.data.remainingTechnicalTime || selectedAssessment.technicalTimer,
                codingTimeLeft: res.data.remainingCodingTime || selectedAssessment.codingTimer,
                warningCount: 0,
                isTerminated: false,
            });

            // Enter fullscreen
            try {
                await document.documentElement.requestFullscreen();
            } catch { }

            navigate('/sections');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to start assessment');
        } finally {
            setLoading(false);
        }
    };

    const allReady = cameraConsent && micConsent && rulesAccepted && cameraReady && micReady && selectedAssessment;

    const rules = [
        'This is a proctored assessment. Your webcam and microphone will be active throughout.',
        'Do not switch tabs or minimize the browser. Tab switches will be flagged.',
        'The assessment must be completed in fullscreen mode.',
        'Copying, pasting, and right-clicking are disabled during the assessment.',
        'Each section has an independent timer that cannot be paused once started.',
        'The master timer runs continuously. When it expires, all sections auto-submit.',
        'Three (3) violations will result in immediate termination of your assessment.',
        'Any suspicious activity (multiple faces, no face detected) will be flagged.',
        'Ensure you are in a well-lit, quiet environment before starting.',
        'Once submitted, you cannot retake the assessment.'
    ];

    return (
        <div className="min-h-screen bg-dark-950 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Assessment Instructions</h1>
                    <p className="text-dark-400">Welcome, <span className="text-primary-400">{user?.name}</span>. Please read all instructions carefully.</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Assessment Selection */}
                {assessments.length > 0 && (
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Assessment
                        </h2>
                        <div className="space-y-3">
                            {assessments.map(a => (
                                <label key={a._id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
                  ${selectedAssessment?._id === a._id
                                        ? 'border-primary-500 bg-primary-500/10'
                                        : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'}`}>
                                    <input
                                        type="radio"
                                        name="assessment"
                                        checked={selectedAssessment?._id === a._id}
                                        onChange={() => setSelectedAssessment(a)}
                                        className="w-4 h-4 text-primary-500"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-white">{a.title}</p>
                                        <p className="text-sm text-dark-400 mt-1">{a.description}</p>
                                        <div className="flex gap-4 mt-2 text-xs text-dark-500">
                                            <span>Technical: {Math.floor(a.technicalTimer / 60)} min</span>
                                            <span>Coding: {Math.floor(a.codingTimer / 60)} min</span>
                                            <span>Total: {Math.floor(a.masterTimer / 60)} min</span>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rules */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Assessment Rules
                    </h2>
                    <ul className="space-y-3">
                        {rules.map((rule, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-dark-300">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-dark-700 flex items-center justify-center text-xs font-medium text-dark-400 mt-0.5">
                                    {i + 1}
                                </span>
                                {rule}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Consent & Permissions */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Permissions & Consent
                    </h2>

                    <div className="space-y-4">
                        {/* Camera */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-dark-800/50 border border-dark-700">
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={cameraConsent} onChange={(e) => setCameraConsent(e.target.checked)}
                                        className="w-4 h-4 rounded text-primary-500" />
                                    <span className="text-sm text-dark-300">I consent to webcam monitoring</span>
                                </label>
                            </div>
                            <button onClick={requestCamera} disabled={!cameraConsent || cameraReady}
                                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${cameraReady
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 border border-primary-500/30'}`}>
                                {cameraReady ? '✓ Camera Ready' : 'Enable Camera'}
                            </button>
                        </div>

                        {/* Microphone */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-dark-800/50 border border-dark-700">
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={micConsent} onChange={(e) => setMicConsent(e.target.checked)}
                                        className="w-4 h-4 rounded text-primary-500" />
                                    <span className="text-sm text-dark-300">I consent to microphone monitoring</span>
                                </label>
                            </div>
                            <button onClick={requestMic} disabled={!micConsent || micReady}
                                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${micReady
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 border border-primary-500/30'}`}>
                                {micReady ? '✓ Mic Ready' : 'Enable Mic'}
                            </button>
                        </div>

                        {/* Rules Acceptance */}
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-dark-800/50 border border-dark-700">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={rulesAccepted} onChange={(e) => setRulesAccepted(e.target.checked)}
                                    className="w-4 h-4 rounded text-primary-500" />
                                <span className="text-sm text-dark-300">I have read and agree to all assessment rules</span>
                            </label>
                        </div>
                    </div>

                    {/* Camera Preview */}
                    {cameraReady && (
                        <div className="mt-4">
                            <p className="text-xs text-dark-500 mb-2">Camera Preview</p>
                            <video ref={videoRef} autoPlay muted playsInline
                                className="w-48 h-36 rounded-xl object-cover border border-dark-600" />
                        </div>
                    )}
                </div>

                {/* Start Button */}
                <div className="text-center">
                    <button
                        onClick={handleStart}
                        disabled={!allReady || loading}
                        className="btn-primary text-lg px-12 py-4"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Starting...
                            </span>
                        ) : (
                            'Start Assessment'
                        )}
                    </button>
                    {!allReady && (
                        <p className="mt-3 text-sm text-dark-500">Complete all steps above to enable the start button</p>
                    )}
                </div>
            </div>
        </div>
    );
}
