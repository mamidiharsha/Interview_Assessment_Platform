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

// Admin
export const getDashboard = () => api.get('/admin/dashboard');
export const getCandidates = () => api.get('/admin/candidates');
export const getCandidateDetail = (id) => api.get(`/admin/candidates/${id}`);
export const exportResults = () => api.get('/admin/export', { responseType: 'blob' });

// Assessments
export const getAssessments = () => api.get('/assessments');
export const createAssessment = (data) => api.post('/assessments', data);
export const updateAssessment = (id, data) => api.put(`/assessments/${id}`, data);
export const toggleAssessment = (id) => api.patch(`/assessments/${id}/toggle`);
export const deleteAssessment = (id) => api.delete(`/assessments/${id}`);

// Questions
export const getQuestions = (assessmentId, section) =>
    api.get(`/questions/assessment/${assessmentId}`, { params: { section } });
export const createQuestion = (data) => api.post('/questions', data);
export const updateQuestion = (id, data) => api.put(`/questions/${id}`, data);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`);

// Register candidate
export const registerCandidate = (data) => api.post('/auth/register', data);

export default api;
