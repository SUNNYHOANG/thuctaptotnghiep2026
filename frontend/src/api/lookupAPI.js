import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const lookupAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

lookupAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const lookupAPIEndpoints = {
  getGiangVienList: () => lookupAPI.get('/lookup/giangvien'),
  getHocKyList: () => lookupAPI.get('/lookup/hocky'),
  getPhongHocList: () => lookupAPI.get('/lookup/phonghoc'),
};

export default lookupAPI;

