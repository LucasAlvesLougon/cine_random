import { describe, it, expect } from 'vitest';
import { formatUserName } from '../utils/format';
import { getPeriodOfDay } from '../utils/time';

describe('formatUserName', () => {
    it('deve retornar "Usuário" quando o email for nulo ou vazio', () => {
        expect(formatUserName(null)).toBe('Usuário');
        expect(formatUserName('')).toBe('Usuário');
    });

    it('deve extrair e capitalizar o primeiro nome corretamente', () => {
        expect(formatUserName('lucas.lougon@example.com')).toBe('Lucas');
        expect(formatUserName('ana_maria@domain.com')).toBe('Ana');
        expect(formatUserName('rodrigo-silva@test.com')).toBe('Rodrigo');
    });

    it('deve remover números do prefixo de email', () => {
        expect(formatUserName('carlos123@gmail.com')).toBe('Carlos');
    });
});

describe('getPeriodOfDay', () => {
    it('deve retornar uma saudação válida (Manhã, Tarde ou Noite)', () => {
        const period = getPeriodOfDay();
        expect(['Manhã', 'Tarde', 'Noite']).toContain(period);
    });
});
