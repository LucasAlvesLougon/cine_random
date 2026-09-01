import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const email = localStorage.getItem('user_email');
        if (token && email) {
            setUser({ email });
        }
        setLoading(false);
    }, []);

    const loginEmail = async (email, password) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        const response = await api.post('/auth/login', formData);
        const data = response.data;
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_email', email);
        setUser({ email });
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
            setUser({ email: data.email });
        } catch (error) {
            console.error('Erro no login com Google:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_email');
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


