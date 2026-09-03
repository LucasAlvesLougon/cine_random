import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { HistoryModal } from '../components/Modal/HistoryModal';
import { ToastProvider } from '../contexts/ToastContext';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
    api: {
        get: vi.fn(),
        delete: vi.fn()
    }
}));

describe('HistoryModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('não deve renderizar quando isOpen for false', () => {
        const { container } = render(
            <ToastProvider>
                <HistoryModal isOpen={false} onClose={vi.fn()} listCode="PIP01" onOpenInfo={vi.fn()} />
            </ToastProvider>
        );
        expect(container.querySelector('.overlay')).toBeNull();
    });

    it('deve buscar e exibir itens do histórico quando aberto', async () => {
        const mockHistoryData = [
            {
                id: 1,
                movie_title: 'Interestelar',
                movie_poster: 'https://image.tmdb.org/t/p/w500/interstellar.jpg',
                draw_type: 'roulette',
                drawn_at: '2026-09-02T15:00:00Z'
            }
        ];

        api.get.mockResolvedValueOnce({ data: mockHistoryData });

        render(
            <ToastProvider>
                <HistoryModal isOpen={true} onClose={vi.fn()} listCode="PIP01" onOpenInfo={vi.fn()} />
            </ToastProvider>
        );

        expect(screen.getByText('Histórico de Sorteios')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Interestelar')).toBeInTheDocument();
            expect(screen.getByText('Roleta')).toBeInTheDocument();
            expect(screen.getByText('Limpar (+7 dias)')).toBeInTheDocument();
        });
    });
});
