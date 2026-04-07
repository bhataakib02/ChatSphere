import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim()
    ? import.meta.env.VITE_API_BASE_URL.trim()
    : '/api';

const api = axios.create({
    baseURL,
});

api.interceptors.request.use((config) => {
    const raw = localStorage.getItem('user');
    let token: string | null = null;
    if (raw) {
        try {
            token = JSON.parse(raw).token ?? null;
        } catch {
            token = null;
        }
    }
    if (!token) {
        token = localStorage.getItem('token');
    }
    if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
});

export default api;
