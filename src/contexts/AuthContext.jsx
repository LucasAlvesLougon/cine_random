import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { clearSessionStorage } from '../utils/storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const token = localStorage.getItem('access_token');
            const email = localStorage.getItem('user_email');
            const idStr = localStorage.getItem('user_id');
            const id = idStr ? parseInt(idStr, 10) : undefined;
            if (token && email) {
                return { email, id };
            }
        } catch (e) {
            console.error('Erro ao restaurar sessão:', e);
        }
        return null;
    });
    const [loading] = useState(false);

    useEffect(() => {
        const handleUnauthorized = () => {
            setUser(null);
            clearSessionStorage();
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, []);

    const loginEmail = async (email, password) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        const response = await api.post('/auth/login', formData);
        const data = response.data;
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_email', data.email || email);
        localStorage.setItem('last_google_email', data.email || email);
        if (data.user_id) localStorage.setItem('user_id', String(data.user_id));
        setUser({ email: data.email || email, id: data.user_id });
    };

    const signupEmail = async (email, password) => {
        await api.post('/auth/signup', { email, password });
        await loginEmail(email, password);
    };

    const persistSession = (data, fallbackEmail) => {
        const sessionEmail = data.email || fallbackEmail;
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_email', sessionEmail);
        localStorage.setItem('last_google_email', sessionEmail);
        if (data.user_id) localStorage.setItem('user_id', String(data.user_id));
        setUser({ email: sessionEmail, id: data.user_id });
        return data;
    };

    const loginWithGoogle = async (credential) => {
        const response = await api.post('/auth/google', { credential });
        return persistSession(response.data);
    };

    const confirmGoogleLink = async (credential, password) => {
        const response = await api.post('/auth/google/confirm-link', {
            credential,
            password,
        });
        return persistSession(response.data);
    };

    const processGoogleToken = async (credential) => {
        return loginWithGoogle(credential);
    };

    const loginDemo = async (email) => {
        const response = await api.post('/auth/demo', { email });
        return persistSession(response.data, email);
    };

    const logout = () => {
        clearSessionStorage();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginEmail, signupEmail, loginWithGoogle, confirmGoogleLink, loginDemo, processGoogleToken, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}


