const TMDB_API_KEY = "7a1dcf62353d2f27e784daeae52443d0";
const BASE_URL = "https://api.themoviedb.org/3";

export async function fetchMovieDetails(movieTitle) {
    try {
    const searchRes = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieTitle)}&language=pt-BR`);
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
        throw new Error("Filme não encontrado");
    }

    const movie = searchData.results[0];
    const detailsRes = await fetch(`${BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=watch/providers,videos&include_video_language=pt-BR,en,null`);
    const details = await detailsRes.json();

    const providersBR = details['watch/providers']?.results?.BR?.flatrate || [];
    const watchProviders = providersBR.map(p => ({
        name: p.provider_name,
        logoUrl: `https://image.tmdb.org/t/p/w200${p.logo_path}`
    }));

    const trailerObj = details.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') 
                    || details.videos?.results?.find(v => v.site === 'YouTube');

    return {
        title: details.title,
        posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null,
        backdropUrl: details.backdrop_path ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}` : null,
        synopsis: details.overview,
        genres: details.genres?.map(g => g.name) || [],
        releaseYear: details.release_date ? details.release_date.split('-')[0] : 'N/A',
        runtime: details.runtime,
        tmdbRating: Math.round(details.vote_average * 10) / 10,
        tmdbId: details.id,
        watched: false,
        watchProviders,
        trailerKey: trailerObj ? trailerObj.key : null
    };
    } catch (error) {
    console.error("Erro na busca do TMDB:", error);
    throw error;
    }
}

const detailedMovieCache = {};
const isFetchingCache = {};

function getCacheKey(genreId, decade) {
    return `${genreId || 'all'}_${decade || 'all'}`;
}

async function replenishCache(genreId, decade, cacheKey) {
    if (isFetchingCache[cacheKey]) return;
    isFetchingCache[cacheKey] = true;

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
            throw new Error("Nenhum filme encontrado.");
        }

        const totalPages = Math.min(initialData.total_pages, 30);
        const randomPage = Math.floor(Math.random() * totalPages) + 1;
        
        const pageRes = await fetch(`${url}&page=${randomPage}`);
        const pageData = await pageRes.json();
        
        const shuffled = pageData.results.sort(() => 0.5 - Math.random());
        const selectedToFetch = shuffled.slice(0, 4);

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
        isFetchingCache[cacheKey] = false;
    }
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

    await replenishCache(genreId, decade, cacheKey);
    
    if (detailedMovieCache[cacheKey] && detailedMovieCache[cacheKey].length > 0) {
        return detailedMovieCache[cacheKey].pop();
    } else {
        throw new Error("Nenhum filme encontrado para essa combinação bizarra.");
    }
}

export async function fetchExtraMovieDetails(tmdbId) {
    if (!tmdbId) return { watchProviders: [], trailerKey: null };
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
    } catch (e) {
        return { watchProviders: [], trailerKey: null };
    }
}