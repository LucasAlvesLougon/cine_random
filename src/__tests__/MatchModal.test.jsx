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

    it('deve renderizar o primeiro filme não assistido e permitir votar', () => {
        render(
            <MatchModal isOpen={true} onClose={vi.fn()} movies={mockMovies} onOpenInfo={vi.fn()} />
        );

        expect(screen.getByText('Filme A')).toBeInTheDocument();
        expect(screen.getByText('💚 Assistir')).toBeInTheDocument();
        expect(screen.getByText('✕ Passar')).toBeInTheDocument();

        // Clica em curtir o Filme A
        fireEvent.click(screen.getByText('💚 Assistir'));

        // Avança para o Filme B
        expect(screen.getByText('Filme B')).toBeInTheDocument();
    });

    it('deve exibir a tela de resultado ao concluir os votos', () => {
        render(
            <MatchModal isOpen={true} onClose={vi.fn()} movies={mockMovies} onOpenInfo={vi.fn()} />
        );

        // Vota no Filme A
        fireEvent.click(screen.getByText('💚 Assistir'));
        // Vota no Filme B
        fireEvent.click(screen.getByText('✕ Passar'));

        // Tela de resultado
        expect(screen.getByText('Sessão de Votação Concluída!')).toBeInTheDocument();
        expect(screen.getByText(/Você deu match em/)).toBeInTheDocument();
    });
});
