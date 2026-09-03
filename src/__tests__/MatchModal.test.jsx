import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MatchModal } from '../components/Modal/MatchModal';

describe('MatchModal', () => {
    const mockMovies = [
        { id: 1, title: 'Filme A', releaseYear: '2020', tmdbRating: 8.0, watched: false },
        { id: 2, title: 'Filme B', releaseYear: '2021', tmdbRating: 7.5, watched: false },
    ];

    it('não deve renderizar quando isOpen for false', () => {
        const { container } = render(
            <MatchModal isOpen={false} onClose={vi.fn()} movies={mockMovies} onOpenInfo={vi.fn()} />
        );
        expect(container.querySelector('.overlay')).toBeNull();
    });

    it('deve renderizar um filme não assistido e permitir votar', async () => {
        render(
            <MatchModal isOpen={true} onClose={vi.fn()} movies={mockMovies} onOpenInfo={vi.fn()} />
        );

        expect(screen.getAllByText(/Filme (A|B)/).length).toBeGreaterThan(0);
        const likeBtn = screen.getByTitle('Quero Assistir (Swipe Direita)');
        const dislikeBtn = screen.getByTitle('Passar Filme (Swipe Esquerda)');
        expect(likeBtn).toBeInTheDocument();
        expect(dislikeBtn).toBeInTheDocument();

        // Clica em curtir o primeiro filme
        fireEvent.click(likeBtn);

        // Avança para o segundo filme no contador
        await waitFor(() => {
            expect(screen.getByText('2 de 2')).toBeInTheDocument();
        });
    });

    it('deve exibir a tela de resultado ao concluir os votos', async () => {
        render(
            <MatchModal isOpen={true} onClose={vi.fn()} movies={mockMovies} onOpenInfo={vi.fn()} />
        );

        const likeBtn = screen.getByTitle('Quero Assistir (Swipe Direita)');
        const dislikeBtn = screen.getByTitle('Passar Filme (Swipe Esquerda)');

        // Vota no primeiro filme
        fireEvent.click(likeBtn);

        await waitFor(() => {
            expect(screen.getByText('2 de 2')).toBeInTheDocument();
        });

        // Vota no segundo filme
        fireEvent.click(dislikeBtn);

        // Tela de resultado
        await waitFor(() => {
            expect(screen.getByText('Sessão de Votação Concluída')).toBeInTheDocument();
            expect(screen.getByText(/Você deu match em/)).toBeInTheDocument();
        });
    });
});
