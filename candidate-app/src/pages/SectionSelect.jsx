import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssessmentContext, AuthContext } from '../App';
import { getAssessment } from '../api';
import TopBar from '../components/TopBar';

export default function SectionSelect() {
    const { assessmentState } = useContext(AssessmentContext);
    const { user } = useContext(AuthContext);
    const [assessment, setAssessment] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!assessmentState.assessmentId) {
            navigate('/instructions');
            return;
        }
        loadAssessment();
    }, []);

    const loadAssessment = async () => {
        try {
            const res = await getAssessment(assessmentState.assessmentId);
            setAssessment(res.data);
        } catch {
            navigate('/instructions');
        }
    };

    const sections = [
        {
            id: 'technical',
            title: 'Technical Assessment',
            description: 'Multiple choice questions and theory questions covering data structures, algorithms, web technologies, and system design.',
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            ),
            timer: assessment ? Math.floor(assessment.technicalTimer / 60) : 0,
            timeLeft: assessmentState.technicalTimeLeft,
            gradient: 'from-blue-500 to-cyan-500',
            bgGlow: 'bg-blue-500/10',
            route: '/assessment/technical',
            questionCount: '10 Questions'
        },
        {
            id: 'coding',
            title: 'Coding Assessment',
            description: 'Solve coding problems with an integrated code editor. Supports multiple languages with real-time test case evaluation.',
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
            ),
            timer: assessment ? Math.floor(assessment.codingTimer / 60) : 0,
            timeLeft: assessmentState.codingTimeLeft,
            gradient: 'from-purple-500 to-pink-500',
            bgGlow: 'bg-purple-500/10',
            route: '/assessment/coding',
            questionCount: '3 Problems'
        }
    ];

    return (
        <div className="min-h-screen bg-dark-950">
            <TopBar />
            <div className="max-w-4xl mx-auto p-6 pt-24">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Choose a Section</h1>
                    <p className="text-dark-400">Select a section to begin. Each section has its own timer.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => navigate(section.route)}
                            className="glass-card p-6 text-left hover:border-dark-500 transition-all duration-300 group relative overflow-hidden"
                        >
                            {/* Glow effect */}
                            <div className={`absolute -top-20 -right-20 w-40 h-40 ${section.bgGlow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                            <div className="relative z-10">
                                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${section.gradient} text-white shadow-lg mb-4`}>
                                    {section.icon}
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">{section.title}</h3>
                                <p className="text-sm text-dark-400 leading-relaxed mb-4">{section.description}</p>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="badge-info">{section.questionCount}</span>
                                        <span className="text-xs text-dark-500">{section.timer} min</span>
                                    </div>
                                    <svg className="w-5 h-5 text-dark-500 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Master Timer Info */}
                <div className="mt-8 text-center">
                    <div className="inline-flex items-center gap-2 bg-dark-800/50 border border-dark-700 rounded-full px-5 py-2.5">
                        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-dark-300">
                            Master Timer: <span className="text-white font-semibold">{Math.floor(assessmentState.masterTimeLeft / 60)} min</span> remaining
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
