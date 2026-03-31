import { describe, it, expect } from 'vitest';

describe('Testes Iniciais', () => {
    it('deve somar corretamente', () => {
        expect(1 + 1).toBe(2);
    });

    it('deve validar ambiente', () => {
        expect(process.env.NODE_ENV).toBeDefined();
    });
});
