const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "7a1dcf62353d2f27e784daeae52443d0";
const BASE_URL = "https://api.themoviedb.org/3";

export async function searchMoviesAutocomplete(query) {
    if (!query || query.trim().length < 2) return [];

    try {
        const res = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&page=1`);
        const data = await res.json();
        
        if (!data.results) return [];

        return data.results.slice(0, 5).map(m => ({
            id: m.id,
            title: m.title,
            releaseYear: m.release_date ? m.release_date.split('-')[0] : 'N/A',
            posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w200${m.poster_path}` : null,
            tmdbRating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : 0
        }));
    } catch (e) {
        console.error("Autocomplete search error:", e);
        return [];
    }
}

export async function fetchMovieDetailsById(tmdbId) {
    try {
        const detailsRes = await fetch(`${BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=watch/providers,videos,credits&include_video_language=pt-BR,en,null`);
        const movie = await detailsRes.json();

        const providersBR = movie['watch/providers']?.results?.BR?.flatrate || [];
        const watchProviders = providersBR.map(p => ({
            name: p.provider_name,
            logoUrl: `https://image.tmdb.org/t/p/w200${p.logo_path}`
        }));

        const trailerObj = movie.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') 
                        || movie.videos?.results?.find(v => v.site === 'YouTube');

        const director = movie.credits?.crew?.find(c => c.job === 'Director')?.name || null;
        const cast = (movie.credits?.cast || []).slice(0, 8).map(actor => ({
            id: actor.id,
            name: actor.name,
            character: actor.character || '',
            profileUrl: actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : null
        }));

        return {
            title: movie.title || "Filme sem título",
            posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
            backdropUrl: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
            synopsis: movie.overview || "Sinopse não disponível.",
            genres: movie.genres?.map(g => g.name) || [],
            releaseYear: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
            runtime: movie.runtime || 0,
            tmdbRating: movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : 0,
            tmdbId: movie.id,
            watched: false,
            watchProviders,
            trailerKey: trailerObj ? trailerObj.key : null,
            director,
            cast
        };
    } catch (error) {
        console.error("Erro na busca por ID do TMDB:", error);
        throw error;
    }
}

export async function fetchMovieDetails(movieTitle) {
    try {
        const searchRes = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieTitle)}&language=pt-BR`);
        const searchData = await searchRes.json();

        if (!searchData.results || searchData.results.length === 0) {
            throw new Error("Filme não encontrado");
        }

        const movie = searchData.results[0];
        return await fetchMovieDetailsById(movie.id);
    } catch (error) {
        console.error("Erro na busca do TMDB:", error);
        throw error;
    }
}

const detailedMovieCache = {};
const activeCachePromises = {};

function getCacheKey(genreId, decade) {
    return `${genreId || 'all'}_${decade || 'all'}`;
}

async function fetchMoviesFromTmdb(genreId, decade) {
    let url = `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&sort_by=popularity.desc&vote_count.gte=30`;
    
    if (genreId) url += `&with_genres=${genreId}`;
    
    if (decade) {
        if (decade === 'recent') {
            url += `&primary_release_date.gte=2020-01-01`;
        } else {
            const startYear = decade;
            const endYear = parseInt(decade) + 9;
            url += `&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31`;
        }
    }

    const initialRes = await fetch(url);
    const initialData = await initialRes.json();
    
    if (!initialData.results || initialData.results.length === 0) {
        // Se filtro específico não retornou, tenta com menos restrição
        const fallbackUrl = `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&sort_by=popularity.desc`;
        const fbRes = await fetch(fallbackUrl);
        const fbData = await fbRes.json();
        return fbData.results || [];
    }

    const totalPages = Math.min(initialData.total_pages || 1, 20);
    const randomPage = Math.floor(Math.random() * totalPages) + 1;
    
    const pageRes = await fetch(`${url}&page=${randomPage}`);
    const pageData = await pageRes.json();
    
    return pageData.results && pageData.results.length > 0 ? pageData.results : initialData.results;
}

async function replenishCache(genreId, decade, cacheKey) {
    if (activeCachePromises[cacheKey]) {
        return activeCachePromises[cacheKey];
    }

    const promise = (async () => {
        try {
            const rawMovies = await fetchMoviesFromTmdb(genreId, decade);
            if (!rawMovies || rawMovies.length === 0) return;

            const shuffled = rawMovies.sort(() => 0.5 - Math.random());
            const selectedToFetch = shuffled.slice(0, 4);

            const detailedResults = await Promise.allSettled(
                selectedToFetch.map(baseMovie => fetchMovieDetailsById(baseMovie.id))
            );

            const newMovies = detailedResults
                .filter(res => res.status === 'fulfilled' && res.value && res.value.title)
                .map(res => res.value);

            if (!detailedMovieCache[cacheKey]) {
                detailedMovieCache[cacheKey] = [];
            }
            detailedMovieCache[cacheKey].push(...newMovies);

        } catch (e) {
            console.error("Cache replenish error", e);
        } finally {
            delete activeCachePromises[cacheKey];
        }
    })();

    activeCachePromises[cacheKey] = promise;
    return promise;
}

export function preloadMovieCache(genreId = '', decade = '') {
    const cacheKey = getCacheKey(genreId, decade);
    if (!detailedMovieCache[cacheKey] || detailedMovieCache[cacheKey].length < 2) {
        replenishCache(genreId, decade, cacheKey);
    }
}

export async function fetchRandomMovieByOptions({ genreId, decade }) {
    const cacheKey = getCacheKey(genreId, decade);

    // 1. Tenta tirar do cache se já pronto
    if (detailedMovieCache[cacheKey] && detailedMovieCache[cacheKey].length > 0) {
        const movie = detailedMovieCache[cacheKey].pop();
        if (detailedMovieCache[cacheKey].length < 2) {
            replenishCache(genreId, decade, cacheKey);
        }
        return movie;
    }

    // 2. Aguarda preenchimento
    await replenishCache(genreId, decade, cacheKey);
    
    if (detailedMovieCache[cacheKey] && detailedMovieCache[cacheKey].length > 0) {
        return detailedMovieCache[cacheKey].pop();
    }

    // 3. Fallback garantido direto
    const rawMovies = await fetchMoviesFromTmdb(genreId, decade);
    if (rawMovies && rawMovies.length > 0) {
        const randomMovie = rawMovies[Math.floor(Math.random() * rawMovies.length)];
        return await fetchMovieDetailsById(randomMovie.id);
    }

    // 4. Último fallback de segurança absoluto (filme popular do TMDB)
    const popRes = await fetch(`${BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`);
    const popData = await popRes.json();
    if (popData.results && popData.results.length > 0) {
        const randomMovie = popData.results[Math.floor(Math.random() * popData.results.length)];
        return await fetchMovieDetailsById(randomMovie.id);
    }

    throw new Error("Não foi possível sortear um filme no momento. Tente novamente.");
}

export async function fetchExtraMovieDetails(tmdbId) {
    try {
        const res = await fetch(`${BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=watch/providers,videos,credits&include_video_language=pt-BR,en,null`);
        const data = await res.json();
        
        const providersBR = data['watch/providers']?.results?.BR?.flatrate || [];
        const watchProviders = providersBR.map(p => ({
            name: p.provider_name,
            logoUrl: `https://image.tmdb.org/t/p/w200${p.logo_path}`
        }));

        const trailerObj = data.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') 
                        || data.videos?.results?.find(v => v.site === 'YouTube');

        const director = data.credits?.crew?.find(c => c.job === 'Director')?.name || null;
        const cast = (data.credits?.cast || []).slice(0, 8).map(actor => ({
            id: actor.id,
            name: actor.name,
            character: actor.character || '',
            profileUrl: actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : null
        }));

        return {
            watchProviders,
            trailerKey: trailerObj ? trailerObj.key : null,
            director,
            cast
        };
    } catch {
        return { watchProviders: [], trailerKey: null, director: null, cast: [] };
    }
}