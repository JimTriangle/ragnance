import api from './api';

export const getBotStatus = () => api.get('/bot/status').then(res => res.data);
export const startBot = () => api.post('/bot/start').then(res => res.data);
export const stopBot = () => api.post('/bot/stop').then(res => res.data);