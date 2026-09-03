import axios from 'axios';

// Cria uma base que aponta automaticamente para o nosso FastAPI
export const api = axios.create({
    // Numa aplicação real (Fase 4), você colocaria isso no .env da Vercel
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

// O "Guarda-Costas" do Frontend:
// Antes de QUALQUER requisição sair do React, ele tenta pegar o Token e enviar junto
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const url = error.config?.url || '';
            const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/signup') || url.includes('/auth/google');
            if (!isAuthRoute) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_email');
                localStorage.removeItem('user_id');
                window.dispatchEvent(new Event('auth:unauthorized'));
            }
        }
        return Promise.reject(error);
    }
);