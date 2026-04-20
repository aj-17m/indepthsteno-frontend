import axios from 'axios';

// Stable device fingerprint — generated once, persisted in localStorage
function getDeviceId() {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    const nav = window.navigator;
    const raw = [
      nav.userAgent,
      nav.language,
      nav.hardwareConcurrency,
      screen.width,
      screen.height,
      screen.colorDepth,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ].join('|');
    // Simple hash
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (Math.imul(31, hash) + raw.charCodeAt(i)) | 0;
    }
    id = Math.abs(hash).toString(36) + '-' + Date.now().toString(36);
    localStorage.setItem('deviceId', id);
  }
  return id;
}

export const deviceId = getDeviceId();

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['x-device-id'] = deviceId;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    const code = err.response?.data?.code;
    if (err.response?.status === 403 && (code === 'ACCESS_EXPIRED' || code === 'DEVICE_MISMATCH')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.setItem('expiredMsg', err.response.data.message);
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
