import api from './api';

export async function listExchangeKeys() {
  const res = await api.get('/exchanges');
  return res.data.items || [];
}

export async function getExchangeKey(id) {
  const res = await api.get(`/exchanges/${id}`);
  return res.data;
}

export async function createExchangeKey(data) {
  const res = await api.post('/exchanges', data);
  return res.data;
}

export async function updateExchangeKey(id, data) {
  const res = await api.put(`/exchanges/${id}`, data);
  return res.data;
}

export async function rotateExchangeSecret(id, data) {
  const res = await api.patch(`/exchanges/${id}/secret`, data);
  return res.data;
}

export async function deleteExchangeKey(id) {
  const res = await api.delete(`/exchanges/${id}`);
  return res.data;
}

export async function testExchangeKey(data) {
  const res = await api.post('/exchanges/test', data);
  return res.data;
}