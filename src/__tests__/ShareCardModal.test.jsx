import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ShareCardModal } from '../components/Modal/ShareCardModal';
import { ToastProvider } from '../contexts/ToastContext';

describe('ShareCardModal', () => {
    const mockMovie = {
        id: 1,
        title: 'Interestelar',
        releaseYear: '2014',
        tmdbRating: 8.6,
        posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/w1280/backdrop.jpg',
        genres: ['Ficção Científica', 'Drama'],
        watchProviders: [
            { name: 'Max', logoUrl: 'https://image.tmdb.org/t/p/w200/max.png' }
        ]
    };

    it('não deve renderizar quando isOpen for false', () => {
        const { container } = render(
            <ToastProvider>
                <ShareCardModal isOpen={false} onClose={vi.fn()} movie={mockMovie} listCode="ABC123" />
            </ToastProvider>
        );
        expect(container.querySelector('.overlay')).toBeNull();
    });

    it('deve renderizar o título do filme, provedores e o código da lista', () => {
        render(
            <ToastProvider>
                <ShareCardModal isOpen={true} onClose={vi.fn()} movie={mockMovie} listCode="ABC123" />
            </ToastProvider>
        );

        expect(screen.getByText('Interestelar')).toBeInTheDocument();
        expect(screen.getByText('Max')).toBeInTheDocument();
        expect(screen.getByText('ABC123')).toBeInTheDocument();
        expect(screen.getByText('📋 Copiar para WhatsApp')).toBeInTheDocument();
    });

    it('deve tentar copiar o texto ao clicar no botão de copiar', async () => {
        // Mock clipboard writeText
        const writeTextMock = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
            clipboard: {
                writeText: writeTextMock,
            },
        });

        render(
            <ToastProvider>
                <ShareCardModal isOpen={true} onClose={vi.fn()} movie={mockMovie} listCode="ABC123" />
            </ToastProvider>
        );

        const copyBtn = screen.getByText('📋 Copiar para WhatsApp');
        await act(async () => {
            fireEvent.click(copyBtn);
        });

        expect(writeTextMock).toHaveBeenCalled();
        expect(writeTextMock.mock.calls[0][0]).toContain('Interestelar');
        expect(writeTextMock.mock.calls[0][0]).toContain('ABC123');
    });
});
