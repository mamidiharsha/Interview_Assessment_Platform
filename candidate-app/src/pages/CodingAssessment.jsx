import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssessmentContext } from '../App';
import { getQuestions, saveCodingAnswer, syncTimer, executeCode } from '../api';
import TopBar from '../components/TopBar';
import Editor from '@monaco-editor/react';

const DEFAULT_CODE = {
    javascript: '// Write your solution here\nfunction solve(input) {\n  const lines = input.trim().split("\\n");\n  // your code here\n  \n}\n\n// Read input\nlet data = "";\nprocess.stdin.on("data", c => data += c);\nprocess.stdin.on("end", () => {\n  console.log(solve(data));\n});',
    python: '# Write your solution here\nimport sys\n\ndef solve():\n    input_data = sys.stdin.read().strip()\n    lines = input_data.split("\\n")\n    # your code here\n    \n\nsolve()',
    cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    \n    return 0;\n}',
    java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your solution here\n        \n    }\n}'
};

export default function CodingAssessment() {
    const { assessmentState, setAssessmentState } = useContext(AssessmentContext);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [codes, setCodes] = useState({});
    const [languages, setLanguages] = useState({});
    const [customInput, setCustomInput] = useState('');
    const [output, setOutput] = useState('');
    const [testResults, setTestResults] = useState(null);
    const [running, setRunning] = useState(false);
    const [submittingCode, setSubmittingCode] = useState(false);
    const [sectionTimer, setSectionTimer] = useState(assessmentState.codingTimeLeft);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('description');
    const [outputTab, setOutputTab] = useState('testcases');
    const timerRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!assessmentState.submissionId) {
            navigate('/instructions');
            return;
        }
        loadQuestions();
        return () => clearInterval(timerRef.current);
    }, []);

    useEffect(() => {
        if (questions.length === 0) return;
        timerRef.current = setInterval(() => {
            setSectionTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleSectionSubmit(true);
                    return 0;
                }
                if (prev % 30 === 0) {
                    syncTimer(assessmentState.submissionId, { remainingCodingTime: prev - 1 }).catch(() => { });
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [questions]);

    const loadQuestions = async () => {
        try {
            const res = await getQuestions(assessmentState.assessmentId, 'coding');
            setQuestions(res.data);
            // Initialize default code for each question
            const initCodes = {};
            const initLangs = {};
            res.data.forEach(q => {
                initCodes[q._id] = DEFAULT_CODE.javascript;
                initLangs[q._id] = 'javascript';
            });
            setCodes(initCodes);
            setLanguages(initLangs);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageChange = (questionId, lang) => {
        setLanguages(prev => ({ ...prev, [questionId]: lang }));
        // Only reset code if using default code
        if (codes[questionId] === DEFAULT_CODE[languages[questionId]] || !codes[questionId]) {
            setCodes(prev => ({ ...prev, [questionId]: DEFAULT_CODE[lang] }));
        }
    };

    const handleRun = async () => {
        const q = questions[currentIndex];
        setRunning(true);
        setOutput('');
        setTestResults(null);
        setOutputTab('output');
        try {
            const res = await executeCode(
                codes[q._id],
                languages[q._id],
                null,
                customInput || q.testCases?.[0]?.input || ''
            );
            if (res.data.error) {
                setOutput(`${res.data.error}\n${res.data.errorLog || ''}`);
            } else {
                setOutput(res.data.output || 'No output');
            }
        } catch (err) {
            setOutput('Execution failed. Please try again.');
        } finally {
            setRunning(false);
        }
    };

    const handleSubmitCode = async () => {
        const q = questions[currentIndex];
        setSubmittingCode(true);
        setTestResults(null);
        setOutputTab('testcases');
        try {
            // Get full test cases from question
            const allTestCases = q.testCases || [];
            const res = await executeCode(
                codes[q._id],
                languages[q._id],
                allTestCases,
                null
            );
            setTestResults(res.data);

            // Save the coding answer
            await saveCodingAnswer(
                assessmentState.submissionId,
                q._id,
                codes[q._id],
                languages[q._id],
                {
                    passed: res.data.passed,
                    failed: res.data.failed,
                    total: res.data.total,
                    executionTime: res.data.executionTime,
                    details: res.data.results
                }
            );
        } catch {
            setTestResults({ error: 'Submission failed', results: [] });
        } finally {
            setSubmittingCode(false);
        }
    };

    const handleSectionSubmit = async (auto = false) => {
        clearInterval(timerRef.current);
        setAssessmentState(prev => ({ ...prev, codingTimeLeft: 0 }));
        navigate('/sections');
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const currentQuestion = questions[currentIndex];

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-950 flex flex-col">
            <TopBar />

            {/* Section Timer + Question Tabs */}
            <div className="pt-16 flex items-center justify-between px-4 py-2 bg-dark-900/50 border-b border-dark-700/50">
                <div className="flex items-center gap-2">
                    {questions.map((q, i) => (
                        <button
                            key={q._id}
                            onClick={() => { setCurrentIndex(i); setOutput(''); setTestResults(null); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${i === currentIndex
                                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                                    : 'bg-dark-800 text-dark-400 border border-dark-700 hover:bg-dark-700'}`}
                        >
                            Problem {i + 1}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${sectionTimer < 300 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-dark-800 text-dark-300 border border-dark-700'
                        }`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTime(sectionTimer)}
                    </div>
                    <button onClick={() => handleSectionSubmit(false)} className="btn-secondary text-sm py-2">
                        Finish Section
                    </button>
                </div>
            </div>

            {/* Main Split Layout */}
            {currentQuestion && (
                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT PANEL — Problem Description */}
                    <div className="w-1/2 border-r border-dark-700/50 flex flex-col overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-dark-700/50">
                            {['description', 'constraints', 'examples'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-3 text-sm font-medium capitalize transition-all border-b-2
                    ${activeTab === tab
                                            ? 'text-primary-400 border-primary-500'
                                            : 'text-dark-400 border-transparent hover:text-dark-300'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {activeTab === 'description' && (
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-2">{currentQuestion.title}</h2>
                                    <span className="badge-info mb-4 inline-block">{currentQuestion.points} pts</span>
                                    <div className="prose prose-invert max-w-none mt-4">
                                        <p className="text-dark-300 leading-relaxed whitespace-pre-wrap">{currentQuestion.description}</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'constraints' && (
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-4">Constraints</h3>
                                    <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                                        <pre className="text-sm text-dark-300 whitespace-pre-wrap font-mono">{currentQuestion.constraints || 'No constraints specified'}</pre>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'examples' && (
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-semibold text-dark-300 mb-2">Sample Input</h4>
                                        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                                            <pre className="text-sm text-emerald-400 font-mono">{currentQuestion.sampleInput}</pre>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-dark-300 mb-2">Sample Output</h4>
                                        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                                            <pre className="text-sm text-emerald-400 font-mono">{currentQuestion.sampleOutput}</pre>
                                        </div>
                                    </div>
                                    {/* Test Cases */}
                                    {currentQuestion.testCases?.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-dark-300 mb-2">Visible Test Cases</h4>
                                            {currentQuestion.testCases.map((tc, i) => (
                                                <div key={i} className="mb-3 bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                                                    <p className="text-xs text-dark-500 mb-1">Test Case {i + 1}</p>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-xs text-dark-500 mb-1">Input</p>
                                                            <pre className="text-sm text-dark-300 font-mono">{tc.input}</pre>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-dark-500 mb-1">Expected Output</p>
                                                            <pre className="text-sm text-emerald-400 font-mono">{tc.expectedOutput}</pre>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL — Code Editor */}
                    <div className="w-1/2 flex flex-col overflow-hidden">
                        {/* Editor Header */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-dark-700/50 bg-dark-900/30">
                            <select
                                value={languages[currentQuestion._id] || 'javascript'}
                                onChange={(e) => handleLanguageChange(currentQuestion._id, e.target.value)}
                                className="bg-dark-800 text-dark-300 text-sm rounded-lg px-3 py-1.5 border border-dark-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="cpp">C++</option>
                                <option value="java">Java</option>
                            </select>
                            <div className="flex items-center gap-2">
                                <button onClick={handleRun} disabled={running}
                                    className="flex items-center gap-1.5 bg-dark-700 hover:bg-dark-600 text-dark-300 text-sm px-3 py-1.5 rounded-lg border border-dark-600 transition-all disabled:opacity-50">
                                    {running ? (
                                        <div className="w-3.5 h-3.5 border-2 border-dark-400/30 border-t-dark-300 rounded-full animate-spin"></div>
                                    ) : (
                                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    )}
                                    Run
                                </button>
                                <button onClick={handleSubmitCode} disabled={submittingCode}
                                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-1.5 rounded-lg transition-all disabled:opacity-50">
                                    {submittingCode ? (
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                    Submit
                                </button>
                            </div>
                        </div>

                        {/* Monaco Editor */}
                        <div className="flex-1 min-h-0">
                            <Editor
                                height="100%"
                                language={languages[currentQuestion._id] === 'cpp' ? 'cpp' : languages[currentQuestion._id]}
                                value={codes[currentQuestion._id] || ''}
                                onChange={(value) => setCodes(prev => ({ ...prev, [currentQuestion._id]: value }))}
                                theme="vs-dark"
                                options={{
                                    fontSize: 14,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    padding: { top: 16, bottom: 16 },
                                    lineNumbers: 'on',
                                    renderLineHighlight: 'line',
                                    automaticLayout: true,
                                    tabSize: 2,
                                    wordWrap: 'on',
                                }}
                            />
                        </div>

                        {/* Output Panel */}
                        <div className="h-56 border-t border-dark-700/50 flex flex-col bg-dark-900/30">
                            {/* Output Tabs */}
                            <div className="flex border-b border-dark-700/50">
                                <button
                                    onClick={() => setOutputTab('testcases')}
                                    className={`px-4 py-2 text-xs font-medium border-b-2 transition-all
                    ${outputTab === 'testcases' ? 'text-primary-400 border-primary-500' : 'text-dark-400 border-transparent'}`}
                                >
                                    Test Results
                                </button>
                                <button
                                    onClick={() => setOutputTab('output')}
                                    className={`px-4 py-2 text-xs font-medium border-b-2 transition-all
                    ${outputTab === 'output' ? 'text-primary-400 border-primary-500' : 'text-dark-400 border-transparent'}`}
                                >
                                    Output
                                </button>
                                <button
                                    onClick={() => setOutputTab('input')}
                                    className={`px-4 py-2 text-xs font-medium border-b-2 transition-all
                    ${outputTab === 'input' ? 'text-primary-400 border-primary-500' : 'text-dark-400 border-transparent'}`}
                                >
                                    Custom Input
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3">
                                {outputTab === 'testcases' && testResults && (
                                    <div>
                                        <div className="flex items-center gap-4 mb-3">
                                            <span className="badge-success">{testResults.passed} Passed</span>
                                            <span className="badge-danger">{testResults.failed} Failed</span>
                                            {testResults.executionTime > 0 && (
                                                <span className="text-xs text-dark-500">{testResults.executionTime}ms</span>
                                            )}
                                        </div>
                                        {testResults.error && (
                                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3">
                                                <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap">{testResults.error}\n{testResults.errorLog || ''}</pre>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            {testResults.results?.map((r, i) => (
                                                <div key={i} className={`rounded-lg p-3 border text-xs ${r.passed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
                                                    }`}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className={`font-medium ${r.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {r.isHidden ? `Hidden Test ${i + 1}` : `Test Case ${i + 1}`} — {r.passed ? 'Passed ✓' : 'Failed ✗'}
                                                        </span>
                                                        {r.executionTime && <span className="text-dark-500">{r.executionTime}ms</span>}
                                                    </div>
                                                    {!r.isHidden && (
                                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                                            <div><span className="text-dark-500">Input:</span><pre className="text-dark-300 font-mono mt-1">{r.input}</pre></div>
                                                            <div><span className="text-dark-500">Expected:</span><pre className="text-emerald-400 font-mono mt-1">{r.expected}</pre></div>
                                                            <div><span className="text-dark-500">Got:</span><pre className={`font-mono mt-1 ${r.passed ? 'text-emerald-400' : 'text-red-400'}`}>{r.actual}</pre></div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {outputTab === 'testcases' && !testResults && (
                                    <div className="flex items-center justify-center h-full text-dark-500 text-sm">
                                        Submit your code to see test results
                                    </div>
                                )}

                                {outputTab === 'output' && (
                                    <pre className="text-sm text-dark-300 font-mono whitespace-pre-wrap">
                                        {output || (running ? 'Running...' : 'Run your code to see output')}
                                    </pre>
                                )}

                                {outputTab === 'input' && (
                                    <textarea
                                        value={customInput}
                                        onChange={(e) => setCustomInput(e.target.value)}
                                        className="w-full h-full bg-transparent text-sm text-dark-300 font-mono resize-none focus:outline-none"
                                        placeholder="Enter custom input here..."
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
