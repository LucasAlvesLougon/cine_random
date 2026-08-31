const TMDB_API_KEY = "7a1dcf62353d2f27e784daeae52443d0";
const BASE_URL = "https://api.themoviedb.org/3";

export async function fetchMovieDetails(title) {
    try {
    // 1. Busca o filme pelo nome
    const searchRes = await fetch(
        `${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=pt-BR`
    );
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
        throw new Error("Filme não encontrado no TMDB");
    }

    // Pega o ID do primeiro resultado mais relevante
    const tmdbId = searchData.results[0].id;

    // 2. Busca os detalhes completos do filme (para pegar duração e gêneros)
    const detailsRes = await fetch(
        `${BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR`
    );
    const movie = await detailsRes.json();

    // 3. Formata e retorna o objeto limpinho para o nosso banco de dados
    return {
        title: movie.title,
        posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        synopsis: movie.overview,
        genres: movie.genres.map(g => g.name),
        releaseYear: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
        runtime: movie.runtime,
        tmdbRating: Math.round(movie.vote_average * 10) / 10,
        tmdbId: movie.id,
        watched: false, // Por padrão, filme novo não foi assistido
    };
    } catch (error) {
    console.error("Erro na busca do TMDB:", error);
    throw error;
    }
}