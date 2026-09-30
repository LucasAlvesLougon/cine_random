import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MovieList } from '../components/Movies/MovieList';
import { AddMovie } from '../components/Movies/AddMovie';

const movieState = vi.hoisted(() => ({ current: {} }));
vi.mock('../contexts/MoviesContext', () => ({ useMovies: () => movieState.current }));
vi.mock('../contexts/ToastContext', () => ({ useToast: () => ({ addToast: vi.fn() }) }));
vi.mock('../services/tmdb', () => ({
    fetchMovieDetails: vi.fn(), searchMoviesAutocomplete: vi.fn(), fetchMovieDetailsById: vi.fn(),
}));

describe('experiência da lista de filmes', () => {
    beforeEach(() => {
        movieState.current = {
            movies: [], totalMovies: 0, hasMoreMovies: false, isLoadingMoreMovies: false,
            toggleWatched: vi.fn(), deleteMovie: vi.fn(), loadMoreMovies: vi.fn(), addMovie: vi.fn(),
        };
    });

    it('orienta a adicionar o primeiro filme quando a lista está vazia', () => {
        const onAddFirstMovie = vi.fn();
        render(<MovieList onOpenInfo={vi.fn()} onAddFirstMovie={onAddFirstMovie} />);
        expect(screen.getByText('Sua lista ainda não tem filmes')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Adicionar o primeiro filme' }));
        expect(onAddFirstMovie).toHaveBeenCalledTimes(1);
    });

    it('distingue uma busca sem resultados e não oculta o carregamento de outras páginas', () => {
        movieState.current = {
            ...movieState.current,
            movies: [{ id: 1, title: 'Matrix', watched: false }],
            totalMovies: 60, hasMoreMovies: true,
        };
        render(<MovieList onOpenInfo={vi.fn()} />);
        fireEvent.change(screen.getByPlaceholderText('Buscar filme na lista...'), { target: { value: 'Alien' } });
        expect(screen.getByText(/Nenhum filme carregado corresponde/)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Carregar mais filmes' }));
        expect(movieState.current.loadMoreMovies).toHaveBeenCalledTimes(1);
    });

    it('não apresenta sorteio vazio como erro', () => {
        render(<AddMovie onOpenInfo={vi.fn()} listCode="ABC123" />);
        expect(screen.getByRole('button', { name: 'Sortear da lista' })).toBeDisabled();
        expect(screen.getByText(/Adicione um filme para começar o sorteio/)).toBeInTheDocument();
    });
});
