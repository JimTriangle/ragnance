import api from './api';

export const fetchBots = () => api.get('/bots').then(res => res.data);