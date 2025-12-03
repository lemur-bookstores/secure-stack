import { describe, it, expect } from 'vitest';
import { router } from '../../router';
import { z } from 'zod';

describe('Router System', () => {
    it('should register query procedures', () => {
        const r = router().query('test', {
            handler: async () => 'result'
        });

        const routes = r.getRoutes();
        expect(routes.has('test')).toBe(true);
        expect(routes.get('test').type).toBe('query');
    });

    it('should register mutation procedures', () => {
        const r = router().mutation('update', {
            handler: async () => 'updated'
        });

        const routes = r.getRoutes();
        expect(routes.has('update')).toBe(true);
        expect(routes.get('update').type).toBe('mutation');
    });

    it('should register middleware', () => {
        const r = router().middleware(async (ctx: any, next: () => Promise<void>) => await next());
        expect(r.getMiddlewares()).toHaveLength(1);
    });

    it('should handle input validation definition', () => {
        const schema = z.string();
        const r = router().query('withInput', { input: schema, handler: async ({ input }: { input: string }) => input });

        const route = r.getRoutes().get('withInput');
        expect(route.config.input).toBe(schema);
    });
});
