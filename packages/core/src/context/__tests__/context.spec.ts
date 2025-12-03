import { describe, it, expect } from 'vitest';
import { createContext } from '../context';

describe('Context System', () => {
    it('should create a default context', () => {
        const builder = createContext();
        const ctx = builder.create();
        expect(ctx).toEqual({});
    });

    it('should create a context with initial values', () => {
        const builder = createContext<{ user: string }>();
        const ctx = builder.create({ user: 'test' });
        expect(ctx.user).toBe('test');
    });

    it('should extend context', () => {
        const baseBuilder = createContext<{ user: string }>();
        const extendedBuilder = baseBuilder.extend({ role: 'admin' });

        const ctx = extendedBuilder.create({ user: 'test' });

        expect(ctx.user).toBe('test');
        expect(ctx.role).toBe('admin');
    });

    it('should override base context values', () => {
        const baseBuilder = createContext<{ config: string }>();
        const extendedBuilder = baseBuilder.extend({ config: 'extended' });

        const ctx = extendedBuilder.create({ config: 'initial' });

        // Extension should take precedence over factory defaults if defined in factory logic,
        // but here extension is merged AFTER base factory.
        // Let's check implementation: 
        // const baseContext = previousFactory(initial);
        // return { ...baseContext, ...extension }
        // So extension wins.

        expect(ctx.config).toBe('extended');
    });
});
