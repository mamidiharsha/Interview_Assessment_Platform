import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');

// Assessments
export const getAssessments = () => api.get('/assessments');
export const getAssessment = (id) => api.get(`/assessments/${id}`);

// Questions
export const getQuestions = (assessmentId, section) =>
    api.get(`/questions/assessment/${assessmentId}`, { params: { section } });

// Submissions
export const startSubmission = (assessmentId) => api.post('/submissions/start', { assessmentId });
export const saveTechnicalAnswer = (submissionId, questionId, answer) =>
    api.post(`/submissions/${submissionId}/technical-answer`, { questionId, answer });
export const saveCodingAnswer = (submissionId, questionId, code, language, results) =>
    api.post(`/submissions/${submissionId}/coding-answer`, { questionId, code, language, results });
export const toggleReview = (submissionId, questionId) =>
    api.post(`/submissions/${submissionId}/toggle-review`, { questionId });
export const syncTimer = (submissionId, data) =>
    api.post(`/submissions/${submissionId}/sync-timer`, data);
export const submitAssessment = (submissionId, reason) =>
    api.post(`/submissions/${submissionId}/submit`, { reason });
export const getSubmission = (submissionId) => api.get(`/submissions/${submissionId}`);

// Code Execution
export const executeCode = (code, language, testCases, customInput) =>
    api.post('/execute/run', { code, language, testCases, customInput });

// Violations
export const logViolation = (data) => api.post('/violations', data);

export default api;
