import { describe, expect, it, vi } from 'vitest';

import {
    MOVIE_DETAILS_STALE_TIME,
    movieDetailsQueryKey,
    prefetchMovieDetails,
} from '../services/tmdb';

describe('prefetchMovieDetails', () => {
    it('prefaz a consulta para um candidato da lista sem detalhes de elenco', async () => {
        const queryClient = {
            prefetchQuery: vi.fn().mockResolvedValue(undefined),
            setQueryData: vi.fn(),
        };

        await prefetchMovieDetails(queryClient, { tmdbId: 603 });

        expect(queryClient.prefetchQuery).toHaveBeenCalledWith(expect.objectContaining({
            queryKey: movieDetailsQueryKey(603),
            staleTime: MOVIE_DETAILS_STALE_TIME,
        }));
        expect(queryClient.setQueryData).not.toHaveBeenCalled();
    });

    it('semeia no cache os detalhes que o sorteio de descoberta já recebeu', async () => {
        const queryClient = {
            prefetchQuery: vi.fn(),
            setQueryData: vi.fn(),
        };
        const movie = {
            tmdbId: 603,
            watchProviders: [],
            trailerKey: null,
            director: 'Lana Wachowski',
            cast: [{ id: 1, name: 'Keanu Reeves' }],
        };

        await prefetchMovieDetails(queryClient, movie);

        expect(queryClient.setQueryData).toHaveBeenCalledWith(
            movieDetailsQueryKey(603),
            expect.objectContaining({ director: 'Lana Wachowski', cast: movie.cast }),
        );
        expect(queryClient.prefetchQuery).not.toHaveBeenCalled();
    });
});
