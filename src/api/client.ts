import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  res => res.data,
  err => Promise.reject(err.response?.data || err.message)
);

export const dashboard = {
  getStats: () => api.get('/dashboard/stats'),
};

export const products = {
  list: (params?: any) => api.get('/products', { params }),
  get: (id: number) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

export const customers = {
  list: (params?: any) => api.get('/customers', { params }),
  get: (id: number) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: number, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: number) => api.delete(`/customers/${id}`),
};

export const orders = {
  list: (params?: any) => api.get('/orders', { params }),
  get: (id: number) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  update: (id: number, data: any) => api.put(`/orders/${id}`, data),
};

export const inventory = {
  list: (params?: any) => api.get('/inventory', { params }),
  adjust: (data: any) => api.post('/inventory/adjust', data),
  transfer: (data: any) => api.post('/inventory/transfer', data),
};

export const staff = {
  list: () => api.get('/staff'),
  get: (id: number) => api.get(`/staff/${id}`),
  create: (data: any) => api.post('/staff', data),
  update: (id: number, data: any) => api.put(`/staff/${id}`, data),
  delete: (id: number) => api.delete(`/staff/${id}`),
};

export const suppliers = {
  list: () => api.get('/suppliers'),
  get: (id: number) => api.get(`/suppliers/${id}`),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: number, data: any) => api.put(`/suppliers/${id}`, data),
};

export const returns = {
  list: (params?: any) => api.get('/returns', { params }),
  get: (id: number) => api.get(`/returns/${id}`),
  create: (data: any) => api.post('/returns', data),
  approve: (id: number) => api.post(`/returns/${id}/approve`),
  reject: (id: number) => api.post(`/returns/${id}/reject`),
};

export const promotions = {
  list: () => api.get('/promotions'),
  get: (id: number) => api.get(`/promotions/${id}`),
  create: (data: any) => api.post('/promotions', data),
  update: (id: number, data: any) => api.put(`/promotions/${id}`, data),
};

export const bookkeeping = {
  list: (params?: any) => api.get('/bookkeeping', { params }),
  create: (data: any) => api.post('/bookkeeping', data),
  summary: (params?: any) => api.get('/bookkeeping/summary', { params }),
};

export const tax = {
  list: () => api.get('/tax'),
  getDeclarations: () => api.get('/tax/declarations'),
};

export const messages = {
  list: (params?: any) => api.get('/messages', { params }),
  markRead: (id: number) => api.put(`/messages/${id}/read`),
};
