/**
 * Utilitário de Notificações do Navegador para o Cine Random
 */

export async function requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

export function sendBrowserNotification(title, options = {}) {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return null;
    }

    if (Notification.permission === 'granted' && document.hidden) {
        try {
            return new Notification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                ...options
            });
        } catch {
            return null;
        }
    }

    return null;
}
