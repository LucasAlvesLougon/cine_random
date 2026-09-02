import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

    it('deve renderizar um filme não assistido e permitir votar', () => {
        render(
            <MatchModal isOpen={true} onClose={vi.fn()} movies={mockMovies} onOpenInfo={vi.fn()} />
        );

        expect(screen.getByText(/Filme (A|B)/)).toBeInTheDocument();
        expect(screen.getByText('💚 Assistir')).toBeInTheDocument();
        expect(screen.getByText('✕ Passar')).toBeInTheDocument();

        // Clica em curtir o primeiro filme
        fireEvent.click(screen.getByText('💚 Assistir'));

        // Avança para o segundo filme no contador
        expect(screen.getByText('2 de 2')).toBeInTheDocument();
    });

    it('deve exibir a tela de resultado ao concluir os votos', () => {
        render(
            <MatchModal isOpen={true} onClose={vi.fn()} movies={mockMovies} onOpenInfo={vi.fn()} />
        );

        // Vota no primeiro filme
        fireEvent.click(screen.getByText('💚 Assistir'));
        // Vota no segundo filme
        fireEvent.click(screen.getByText('✕ Passar'));

        // Tela de resultado
        expect(screen.getByText('Sessão de Votação Concluída!')).toBeInTheDocument();
        expect(screen.getByText(/Você deu match em/)).toBeInTheDocument();
    });
});
