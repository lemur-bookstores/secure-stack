/**
 * Static Service Discovery
 * Simple file/config-based service discovery for MVP
 */

import type { ServiceDiscovery, ServiceInfo } from './types';

export class StaticDiscovery implements ServiceDiscovery {
    private services: Map<string, ServiceInfo> = new Map();

    constructor(initialServices: ServiceInfo[] = []) {
        initialServices.forEach(service => {
            this.services.set(service.id, {
                ...service,
                status: 'unknown',
                lastHealthCheck: new Date(),
            });
        });

        console.log(`[StaticDiscovery] Initialized with ${initialServices.length} service(s)`);
    }

    async registerService(service: ServiceInfo): Promise<void> {
        this.services.set(service.id, {
            ...service,
            status: service.status || 'unknown',
            lastHealthCheck: new Date(),
        });

        console.log(`[StaticDiscovery] Registered service: ${service.id} at ${service.host}:${service.port}`);
    }

    async getService(serviceId: string): Promise<ServiceInfo | undefined> {
        return this.services.get(serviceId);
    }

    async listServices(): Promise<ServiceInfo[]> {
        return Array.from(this.services.values());
    }

    async updateServiceHealth(serviceId: string, status: 'healthy' | 'unhealthy'): Promise<void> {
        const service = this.services.get(serviceId);
        if (service) {
            service.status = status;
            service.lastHealthCheck = new Date();
            console.log(`[StaticDiscovery] Updated ${serviceId} health: ${status}`);
        }
    }

    /**
     * Remove a service
     */
    async removeService(serviceId: string): Promise<boolean> {
        const deleted = this.services.delete(serviceId);
        if (deleted) {
            console.log(`[StaticDiscovery] Removed service: ${serviceId}`);
        }
        return deleted;
    }

    /**
     * Get healthy services
     */
    async getHealthyServices(): Promise<ServiceInfo[]> {
        return Array.from(this.services.values()).filter(
            service => service.status === 'healthy'
        );
    }
}
