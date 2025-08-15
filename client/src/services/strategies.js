import api from './api';

export const fetchStrategyKinds = () => api.get('/strategy-kinds').then(r => r.data.items);
export const fetchStrategies = () => api.get('/strategies').then(r => r.data.items);
export const getStrategy = (id) => api.get(`/strategies/${id}`).then(r => r.data);
export const createStrategy = (data) => api.post('/strategies', data).then(r => r.data);
export const updateStrategy = (id, data) => api.put(`/strategies/${id}`, data).then(r => r.data);
export const deleteStrategy = (id) => api.delete(`/strategies/${id}`).then(r => r.data);
export const validateStrategy = (data) => api.post('/strategies/validate', data).then(r => r.data);
export const previewStrategy = (data) => api.post('/strategies/preview', data).then(r => r.data);