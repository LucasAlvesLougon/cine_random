const TMDB_API_KEY = "698c0b5e43a9f023fb2764cb5d2d46e2";
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
        const detailsRes = await fetch(`${BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=watch/providers,videos&include_video_language=pt-BR,en,null`);
        const movie = await detailsRes.json();

        const providersBR = movie['watch/providers']?.results?.BR?.flatrate || [];
        const watchProviders = providersBR.map(p => ({
            name: p.provider_name,
            logoUrl: `https://image.tmdb.org/t/p/w200${p.logo_path}`
        }));

        const trailerObj = movie.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') 
                        || movie.videos?.results?.find(v => v.site === 'YouTube');

        return {
            title: movie.title,
            posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
            backdropUrl: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
            synopsis: movie.overview,
            genres: movie.genres?.map(g => g.name) || [],
            releaseYear: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
            runtime: movie.runtime,
            tmdbRating: Math.round(movie.vote_average * 10) / 10,
            tmdbId: movie.id,
            watched: false,
            watchProviders,
            trailerKey: trailerObj ? trailerObj.key : null
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

async function replenishCache(genreId, decade, cacheKey) {
    if (activeCachePromises[cacheKey]) {
        return activeCachePromises[cacheKey];
    }

    const promise = (async () => {
        try {
            let url = `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&sort_by=popularity.desc&vote_count.gte=200`;
            
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
                return;
            }

            const totalPages = Math.min(initialData.total_pages || 1, 30);
            const randomPage = Math.floor(Math.random() * totalPages) + 1;
            
            const pageRes = await fetch(`${url}&page=${randomPage}`);
            const pageData = await pageRes.json();
            
            if (!pageData.results || pageData.results.length === 0) {
                return;
            }

            const shuffled = pageData.results.sort(() => 0.5 - Math.random());
            const selectedToFetch = shuffled.slice(0, 5);

            const detailedPromises = selectedToFetch.map(async (baseMovie) => {
                const detailsRes = await fetch(`${BASE_URL}/movie/${baseMovie.id}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=watch/providers,videos&include_video_language=pt-BR,en,null`);
                const movie = await detailsRes.json();
                
                const providersBR = movie['watch/providers']?.results?.BR?.flatrate || [];
                const watchProviders = providersBR.map(p => ({
                    name: p.provider_name,
                    logoUrl: `https://image.tmdb.org/t/p/w200${p.logo_path}`
                }));

                const trailerObj = movie.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') 
                                || movie.videos?.results?.find(v => v.site === 'YouTube');

                return {
                    title: movie.title,
                    posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
                    backdropUrl: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
                    synopsis: movie.overview,
                    genres: movie.genres?.map(g => g.name) || [],
                    releaseYear: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
                    runtime: movie.runtime,
                    tmdbRating: Math.round(movie.vote_average * 10) / 10,
                    tmdbId: movie.id,
                    watched: false,
                    watchProviders,
                    trailerKey: trailerObj ? trailerObj.key : null
                };
            });

            const newMovies = await Promise.all(detailedPromises);
            
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

    if (detailedMovieCache[cacheKey] && detailedMovieCache[cacheKey].length > 0) {
        const movie = detailedMovieCache[cacheKey].pop();
        if (detailedMovieCache[cacheKey].length < 2) {
            replenishCache(genreId, decade, cacheKey);
        }
        return movie;
    }

    // Se cache vazio ou em preenchimento, aguarda o replenish
    await replenishCache(genreId, decade, cacheKey);
    
    if (detailedMovieCache[cacheKey] && detailedMovieCache[cacheKey].length > 0) {
        return detailedMovieCache[cacheKey].pop();
    }

    // Fallback de emergência com busca direta se o cache falhou
    const directUrl = `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&sort_by=popularity.desc&vote_count.gte=100`;
    const directRes = await fetch(directUrl);
    const directData = await directRes.json();
    if (directData.results && directData.results.length > 0) {
        const randomMovie = directData.results[Math.floor(Math.random() * directData.results.length)];
        return await fetchMovieDetailsById(randomMovie.id);
    }

    throw new Error("Não foi possível sortear um filme no momento. Tente novamente.");
}

export async function fetchExtraMovieDetails(tmdbId) {
    try {
        const res = await fetch(`${BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=watch/providers,videos&include_video_language=pt-BR,en,null`);
        const data = await res.json();
        
        const providersBR = data['watch/providers']?.results?.BR?.flatrate || [];
        const watchProviders = providersBR.map(p => ({
            name: p.provider_name,
            logoUrl: `https://image.tmdb.org/t/p/w200${p.logo_path}`
        }));

        const trailerObj = data.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') 
                        || data.videos?.results?.find(v => v.site === 'YouTube');

        return {
            watchProviders,
            trailerKey: trailerObj ? trailerObj.key : null
        };
    } catch {
        return { watchProviders: [], trailerKey: null };
    }
}