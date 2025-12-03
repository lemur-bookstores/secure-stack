import { describe, it, expect, beforeEach } from 'vitest';
import { StaticDiscovery } from '../StaticDiscovery';
import { ServiceInfo } from '../types';

describe('StaticDiscovery', () => {
    let discovery: StaticDiscovery;

    beforeEach(() => {
        discovery = new StaticDiscovery();
    });

    it('should register and retrieve a service', async () => {
        const service: ServiceInfo = {
            id: 'test-service',
            host: 'localhost',
            port: 8080,
        };

        await discovery.registerService(service);
        const retrieved = await discovery.getService('test-service');

        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe('test-service');
        expect(retrieved?.host).toBe('localhost');
    });

    it('should update service health', async () => {
        const service: ServiceInfo = {
            id: 'test-service',
            host: 'localhost',
            port: 8080,
        };

        await discovery.registerService(service);
        await discovery.updateServiceHealth('test-service', 'healthy');

        const retrieved = await discovery.getService('test-service');
        expect(retrieved?.status).toBe('healthy');
    });

    it('should list services', async () => {
        await discovery.registerService({ id: 's1', host: 'h1', port: 1 });
        await discovery.registerService({ id: 's2', host: 'h2', port: 2 });

        const list = await discovery.listServices();
        expect(list.length).toBe(2);
    });
});
