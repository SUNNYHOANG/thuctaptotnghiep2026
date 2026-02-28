import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const feeAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

feeAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const feeAPIEndpoints = {
  getUnpaidEnrollments: (mssv) => feeAPI.get(`/fees/unpaid/${mssv}`),
  getDebt: (mssv) => feeAPI.get(`/fees/debt/${mssv}`),
  pay: (mssv, malophocList) => feeAPI.post('/fees/pay', { mssv, malophocList }),
  getReceipts: (mssv) => feeAPI.get(`/fees/receipts/${mssv}`),
};

export default feeAPI;

