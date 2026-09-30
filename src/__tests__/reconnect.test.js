import { describe, expect, it } from 'vitest';
import { getReconnectDelay, MAX_RECONNECT_ATTEMPTS } from '../utils/reconnect';

describe('reconnect backoff', () => {
    it('aumenta o intervalo exponencialmente e limita o máximo', () => {
        expect(getReconnectDelay(0)).toBe(1000);
        expect(getReconnectDelay(1)).toBe(2000);
        expect(getReconnectDelay(5)).toBe(30000);
        expect(getReconnectDelay(99)).toBe(30000);
    });

    it('define um limite de tentativas para evitar loop infinito', () => {
        expect(MAX_RECONNECT_ATTEMPTS).toBe(5);
    });
});
