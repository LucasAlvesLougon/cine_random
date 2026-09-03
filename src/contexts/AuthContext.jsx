import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const email = localStorage.getItem('user_email');
        const idStr = localStorage.getItem('user_id');
        const id = idStr ? parseInt(idStr, 10) : undefined;
        if (token && email) {
            setUser({ email, id });
        }
        setLoading(false);

        const handleUnauthorized = () => {
            setUser(null);
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
        if (data.user_id) localStorage.setItem('user_id', String(data.user_id));
        setUser({ email: data.email || email, id: data.user_id });
    };

    const signupEmail = async (email, password) => {
        await api.post('/auth/signup', { email, password });
        await loginEmail(email, password);
    };

    const processGoogleToken = async (credential) => {
        try {
            const response = await api.post('/auth/google', { idToken: credential });
            const data = response.data;
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user_email', data.email);
            if (data.user_id) localStorage.setItem('user_id', String(data.user_id));
            setUser({ email: data.email, id: data.user_id });
        } catch (error) {
            console.error('Erro no login com Google:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_id');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginEmail, signupEmail, processGoogleToken, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}


