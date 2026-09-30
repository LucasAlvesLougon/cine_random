const MOVIE_CACHE_PREFIX = 'cached_movies_';
const LIST_CACHE_PREFIX = 'cine_random_my_lists_cache_';

export function getUserCacheKey(prefix, userId) {
    return `${prefix}_${userId}`;
}

export function clearUserCachedData() {
    for (const key of Object.keys(localStorage)) {
        if (key.startsWith(MOVIE_CACHE_PREFIX) || key.startsWith(LIST_CACHE_PREFIX)) {
            localStorage.removeItem(key);
        }
    }
}

export function clearSessionStorage() {
    ['access_token', 'user_email', 'user_id', 'last_google_email', 'cine_random_active_list'].forEach((key) => {
        localStorage.removeItem(key);
    });
    clearUserCachedData();
}
