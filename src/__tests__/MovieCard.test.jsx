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
});
