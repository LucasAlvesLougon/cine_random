import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';
import { ToastProvider } from '../contexts/ToastContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const mockLoginWithGoogle = vi.fn();
const mockConfirmGoogleLink = vi.fn();
const mockLoginDemo = vi.fn();

vi.mock('@react-oauth/google', () => ({
    GoogleOAuthProvider: ({ children }) => <div>{children}</div>,
    GoogleLogin: ({ onSuccess }) => (
        <button type="button" onClick={() => onSuccess({ credential: 'signed-google-id-token' })}>
            Continue with Google
        </button>
    ),
}));

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
        confirmGoogleLink: mockConfirmGoogleLink,
        loginDemo: mockLoginDemo,
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
        vi.stubEnv('VITE_ENABLE_DEMO_LOGIN', 'true');
        localStorage.clear();
        delete window.google;
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('renders the custom Google login button and demo link', () => {
        renderApp();

        expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeDefined();
        expect(screen.getByText('Simular contas Google / Demo')).toBeDefined();
    });

    it('submits the signed Google credential returned by GIS', async () => {
        mockLoginWithGoogle.mockResolvedValueOnce({
            access_token: 'app-token',
            email: 'google@example.com'
        });
        renderApp();

        const googleBtn = screen.getByRole('button', { name: /Continue with Google/i });
        fireEvent.click(googleBtn);

        await waitFor(() => {
            expect(mockLoginWithGoogle).toHaveBeenCalledWith('signed-google-id-token');
        });
    });

    it('asks for the local password when the Google email already has an account', async () => {
        mockLoginWithGoogle.mockRejectedValueOnce({
            response: {
                status: 409,
                data: { detail: 'Entre com sua senha para vincular esta conta ao Google.' },
            },
        });
        mockConfirmGoogleLink.mockResolvedValueOnce({
            access_token: 'linked-token',
            email: 'existing@example.com',
        });

        renderApp();
        fireEvent.click(screen.getByRole('button', { name: /Continue with Google/i }));

        expect(
            await screen.findByText('Já existe uma conta com este email.'),
        ).toBeDefined();

        fireEvent.change(screen.getByLabelText('Senha da conta existente'), {
            target: { value: 'securepassword123' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Vincular e entrar' }));

        await waitFor(() => {
            expect(mockConfirmGoogleLink).toHaveBeenCalledWith(
                'signed-google-id-token',
                'securepassword123',
            );
            expect(screen.queryByRole('dialog')).toBeNull();
        });
    });

    it('opens Google simulation modal when clicking demo link', () => {
        renderApp();

        const demoBtn = screen.getByText('Simular contas Google / Demo');
        fireEvent.click(demoBtn);

        expect(screen.getByText('Fazer login com o Google')).toBeDefined();
        expect(screen.getByText('Lucas Lougon')).toBeDefined();
        expect(screen.getByText('Cinéfilo Demo')).toBeDefined();
    });

    it('triggers the isolated demo login when choosing an account in the modal', async () => {
        mockLoginDemo.mockResolvedValueOnce({
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
            expect(mockLoginDemo).toHaveBeenCalledWith('lucas@gmail.com');
        });
    });

    it('allows typing a custom email in the modal and logs in', async () => {
        mockLoginDemo.mockResolvedValueOnce({
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
            expect(mockLoginDemo).toHaveBeenCalledWith('outro@gmail.com');
        });
    });

    it('hides the demo login unless the build flag is explicitly enabled', () => {
        vi.stubEnv('VITE_ENABLE_DEMO_LOGIN', 'false');

        renderApp();

        expect(screen.queryByText('Simular contas Google / Demo')).toBeNull();
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
