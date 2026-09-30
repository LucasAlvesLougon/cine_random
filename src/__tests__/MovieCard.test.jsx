import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MovieCard } from '../components/Movies/MovieCard';

describe('MovieCard', () => {
    const mockMovie = {
        id: 1,
        title: 'Interestelar',
        posterUrl: 'https://image.tmdb.org/t/p/w500/interstellar.jpg',
        releaseYear: '2014',
        tmdbRating: 8.6,
        watched: false,
    };

    it('deve renderizar o título, ano de lançamento e avaliação', () => {
        render(
            <MovieCard 
                movie={mockMovie} 
                onToggleWatched={vi.fn()} 
                onDelete={vi.fn()} 
                onOpenInfo={vi.fn()} 
            />
        );

        expect(screen.getByText('Interestelar')).toBeInTheDocument();
        expect(screen.getByText(/2014/)).toBeInTheDocument();
        expect(screen.getByText(/8.6/)).toBeInTheDocument();
    });

    it('abre a ficha do filme por teclado a partir do pôster ou título', () => {
        const onOpenInfo = vi.fn();
        render(<MovieCard movie={mockMovie} onToggleWatched={vi.fn()} onDelete={vi.fn()} onOpenInfo={onOpenInfo} />);

        fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Interestelar no pôster' }));
        fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Interestelar' }));
        expect(onOpenInfo).toHaveBeenCalledTimes(2);
        expect(screen.getByRole('button', { name: 'Remover Interestelar da lista' })).toBeInTheDocument();
    });

    it('deve chamar onToggleWatched ao clicar no botão de marcar assistido', () => {
        const handleToggle = vi.fn();
        render(
            <MovieCard 
                movie={mockMovie} 
                onToggleWatched={handleToggle} 
                onDelete={vi.fn()} 
                onOpenInfo={vi.fn()} 
            />
        );

        const toggleBtn = screen.getByRole('button', { name: /marcar/i });
        fireEvent.click(toggleBtn);

        expect(handleToggle).toHaveBeenCalledWith(1, false);
    });

    it('deve chamar onDelete ao clicar no botão de remover', () => {
        const handleDelete = vi.fn();
        render(
            <MovieCard 
                movie={mockMovie} 
                onToggleWatched={vi.fn()} 
                onDelete={handleDelete} 
                onOpenInfo={vi.fn()} 
            />
        );

        const deleteBtn = screen.getByTitle('Remover');
        fireEvent.click(deleteBtn);

        expect(handleDelete).toHaveBeenCalledWith(1);
    });

    it('deve renderizar badges de provedores de streaming quando existirem', () => {
        const movieWithProviders = {
            ...mockMovie,
            watchProviders: [
                { name: 'Netflix', logoUrl: 'https://image.tmdb.org/t/p/w200/netflix.png' },
                { name: 'Max', logoUrl: 'https://image.tmdb.org/t/p/w200/max.png' }
            ]
        };

        render(
            <MovieCard 
                movie={movieWithProviders} 
                onToggleWatched={vi.fn()} 
                onDelete={vi.fn()} 
                onOpenInfo={vi.fn()} 
            />
        );

        expect(screen.getByAltText('Netflix')).toBeInTheDocument();
        expect(screen.getByAltText('Max')).toBeInTheDocument();
    });

    it('deve exibir a média de notas do grupo quando houver avaliações', () => {
        const movieWithComments = {
            ...mockMovie,
            comments: [
                { id: 1, user_id: 'user1@test.com', rating: 5, text: 'Ótimo!' },
                { id: 2, user_id: 'user2@test.com', rating: 4, text: 'Muito bom!' }
            ]
        };

        render(
            <MovieCard 
                movie={movieWithComments} 
                onToggleWatched={vi.fn()} 
                onDelete={vi.fn()} 
                onOpenInfo={vi.fn()} 
            />
        );

        expect(screen.getByText(/4.5/)).toBeInTheDocument();
    });
});
