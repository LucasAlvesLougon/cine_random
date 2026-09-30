import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
            expect(screen.getByText('Arquivar (+30 dias)')).toBeInTheDocument();
        });
    });

    it('permite abrir a ficha de um filme salvo pelo teclado', async () => {
        const onOpenInfo = vi.fn();
        const onClose = vi.fn();
        api.get.mockResolvedValueOnce({ data: [{ id: 2, movie_id: 10, movie_title: 'Matrix', movie_poster: null, draw_type: 'roulette', drawn_at: '2026-09-02T15:00:00Z' }] });
        render(<ToastProvider><HistoryModal isOpen onClose={onClose} listCode="PIP01" onOpenInfo={onOpenInfo} /></ToastProvider>);
        const item = await screen.findByRole('button', { name: 'Ver detalhes de Matrix' });
        fireEvent.keyDown(item, { key: 'Enter' });
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onOpenInfo).toHaveBeenCalledWith(expect.objectContaining({ id: 10, title: 'Matrix' }));
    });
});
