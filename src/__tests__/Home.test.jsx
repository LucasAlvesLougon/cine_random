import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home } from '../components/Home/Home';
import { ToastProvider } from '../contexts/ToastContext';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn()
    }
}));

vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 1, email: 'teste@cinema.com' },
        loginEmail: vi.fn(),
        signupEmail: vi.fn(),
        logout: vi.fn()
    })
}));

vi.mock('../hooks/usePwaInstall', () => ({
    usePwaInstall: () => ({
        isInstallable: false,
        isInstalled: false,
        isIos: false,
        promptInstall: vi.fn()
    })
}));

function renderWithProviders(ui) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0
            }
        }
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                {ui}
            </ToastProvider>
        </QueryClientProvider>
    );
}

describe('Home Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        localStorage.setItem('access_token', 'mock_token');
    });

    it('deve carregar e exibir listas do cache local instantaneamente (0ms)', async () => {
        const cachedLists = [
            { id: 1, name: 'Lista Cacheada 1', code: 'CACH01' },
            { id: 2, name: 'Lista Cacheada 2', code: 'CACH02' }
        ];
        localStorage.setItem('cine_random_my_lists_cache', JSON.stringify(cachedLists));
        api.get.mockResolvedValue({ data: cachedLists });

        renderWithProviders(<Home onSelectList={vi.fn()} />);

        // Deve exibir imediatamente as listas salvas no cache
        expect(screen.getByText('Lista Cacheada 1')).toBeInTheDocument();
        expect(screen.getByText('Lista Cacheada 2')).toBeInTheDocument();
        expect(screen.getByText('CACH01')).toBeInTheDocument();
    });

    it('deve buscar listas da API e renderizar na tela', async () => {
        const apiLists = [
            { id: 10, name: 'Filmes de Terror', code: 'TR001' }
        ];
        api.get.mockResolvedValue({ data: apiLists });

        renderWithProviders(<Home onSelectList={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Filmes de Terror')).toBeInTheDocument();
            expect(screen.getByText('TR001')).toBeInTheDocument();
        });
    });

    it('deve chamar onSelectList ao clicar em uma lista', async () => {
        const mockList = { id: 5, name: 'Sci-Fi Favoritos', code: 'SCIFI5' };
        api.get.mockResolvedValue({ data: [mockList] });
        const onSelectList = vi.fn();

        renderWithProviders(<Home onSelectList={onSelectList} />);

        await waitFor(() => {
            expect(screen.getByText('Sci-Fi Favoritos')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Sci-Fi Favoritos'));
        expect(onSelectList).toHaveBeenCalledWith(mockList);
    });

    it('deve permitir abrir o formulário e criar uma nova lista', async () => {
        const newList = { id: 99, name: 'Comédias 90s', code: 'COM90S' };
        api.get.mockResolvedValue({ data: [newList] });
        api.post.mockResolvedValue({ data: newList });

        renderWithProviders(<Home onSelectList={vi.fn()} />);

        const createCard = screen.getByText('+ Nova Lista');
        fireEvent.click(createCard);

        const input = screen.getByPlaceholderText('Nome da Lista');
        fireEvent.change(input, { target: { value: 'Comédias 90s' } });

        const submitBtn = screen.getByRole('button', { name: 'Criar' });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/lists/', expect.objectContaining({ name: 'Comédias 90s' }));
            expect(screen.getByText('Comédias 90s')).toBeInTheDocument();
        });
    });
});
