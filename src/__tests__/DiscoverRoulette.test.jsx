import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DiscoverRoulette } from '../components/Movies/DiscoverRoulette';
import { prefetchMovieDetails } from '../services/tmdb';

const movie = vi.hoisted(() => ({
    tmdbId: 603,
    title: 'Matrix',
    watchProviders: [],
    trailerKey: null,
    director: 'Lana Wachowski',
    cast: [{ id: 1, name: 'Keanu Reeves' }],
}));

vi.mock('../contexts/MoviesContext', () => ({
    useMovies: () => ({ movies: [], addMovie: vi.fn() }),
}));

vi.mock('../contexts/ToastContext', () => ({
    useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('../services/tmdb', () => ({
    fetchRandomMovieByOptions: vi.fn().mockResolvedValue(movie),
    preloadMovieCache: vi.fn(),
    prefetchMovieDetails: vi.fn().mockResolvedValue(movie),
}));

function renderWithQuery(ui) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(ui, {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
    });
}

describe('sorteio de descoberta', () => {
    beforeEach(() => vi.clearAllMocks());

    it('prepara o cache de detalhes quando o filme descoberto vira vencedor', async () => {
        renderWithQuery(<DiscoverRoulette onOpenInfo={vi.fn()} listCode="ABC123" />);

        fireEvent.click(screen.getByRole('button', { name: 'Descobrir filme novo' }));

        await waitFor(() => expect(prefetchMovieDetails).toHaveBeenCalledWith(
            expect.anything(),
            movie,
        ));
    });
});
