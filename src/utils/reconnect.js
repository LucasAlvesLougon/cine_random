export const MAX_RECONNECT_ATTEMPTS = 5;

export function getReconnectDelay(attempt, baseDelay = 1000, maxDelay = 30000) {
    const safeAttempt = Math.max(0, Number(attempt) || 0);
    return Math.min(maxDelay, baseDelay * (2 ** safeAttempt));
}
