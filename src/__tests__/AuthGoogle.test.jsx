import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';
import { ToastProvider } from '../contexts/ToastContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const mockLoginWithGoogle = vi.fn();

vi.mock('../services/api', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    }
}));

vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: null,
        loading: false,
        loginEmail: vi.fn(),
        signupEmail: vi.fn(),
        loginWithGoogle: mockLoginWithGoogle,
        processGoogleToken: mockLoginWithGoogle,
        logout: vi.fn(),
    }),
    AuthProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock('../hooks/usePwaInstall', () => ({
    usePwaInstall: () => ({
        isInstallable: false,
        isInstalled: false,
        isIos: false,
        promptInstall: vi.fn()
    })
}));

function renderApp() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0 }
        }
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <GoogleOAuthProvider clientId="mock-client-id">
                <ToastProvider>
                    <App />
                </ToastProvider>
            </GoogleOAuthProvider>
        </QueryClientProvider>
    );
}

describe('Google Authentication & Modal in App', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        delete window.google;
    });

    it('renders the custom Google login button and demo link', () => {
        renderApp();

        expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeDefined();
        expect(screen.getByText('Simular contas Google / Demo')).toBeDefined();
    });

    it('starts Google direct login on clicking Continue with Google', () => {
        renderApp();

        const googleBtn = screen.getByRole('button', { name: /Continue with Google/i });
        fireEvent.click(googleBtn);

        expect(screen.getByText('Entrando com Google...')).toBeDefined();
    });

    it('opens Google simulation modal when clicking demo link', () => {
        renderApp();

        const demoBtn = screen.getByText('Simular contas Google / Demo');
        fireEvent.click(demoBtn);

        expect(screen.getByText('Fazer login com o Google')).toBeDefined();
        expect(screen.getByText('Lucas Lougon')).toBeDefined();
        expect(screen.getByText('Cinéfilo Demo')).toBeDefined();
    });

    it('triggers loginWithGoogle when choosing an account in the modal', async () => {
        mockLoginWithGoogle.mockResolvedValueOnce({
            access_token: 'fake-token',
            email: 'lucas@gmail.com'
        });

        renderApp();

        const demoBtn = screen.getByText('Simular contas Google / Demo');
        fireEvent.click(demoBtn);

        const lucasCard = screen.getByText('Lucas Lougon').closest('button');
        expect(lucasCard).not.toBeNull();
        fireEvent.click(lucasCard);

        await waitFor(() => {
            expect(mockLoginWithGoogle).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: 'lucas@gmail.com',
                    name: 'Lucas Lougon'
                })
            );
        });
    });

    it('allows typing a custom email in the modal and logs in', async () => {
        mockLoginWithGoogle.mockResolvedValueOnce({
            access_token: 'fake-token',
            email: 'outro@gmail.com'
        });

        renderApp();

        const demoBtn = screen.getByText('Simular contas Google / Demo');
        fireEvent.click(demoBtn);

        const input = screen.getByPlaceholderText('outro@gmail.com');
        fireEvent.change(input, { target: { value: 'outro@gmail.com' } });

        const submitBtn = screen.getByRole('button', { name: 'Entrar' });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockLoginWithGoogle).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: 'outro@gmail.com',
                    name: 'outro'
                })
            );
        });
    });

    it('closes the modal when clicking the close button', () => {
        renderApp();

        const demoBtn = screen.getByText('Simular contas Google / Demo');
        fireEvent.click(demoBtn);

        expect(screen.getByText('Fazer login com o Google')).toBeDefined();

        const closeBtn = screen.getByRole('button', { name: 'Fechar' });
        fireEvent.click(closeBtn);

        expect(screen.queryByText('Fazer login com o Google')).toBeNull();
    });
});
