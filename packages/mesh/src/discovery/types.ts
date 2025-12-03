/**
 * Service Discovery Types
 */

export interface ServiceInfo {
    id: string;
    host: string;
    port: number;
    publicKey?: string;
    lastHealthCheck?: Date;
    status?: 'healthy' | 'unhealthy' | 'unknown';
}

export interface ServiceDiscovery {
    registerService(service: ServiceInfo): Promise<void>;
    getService(serviceId: string): Promise<ServiceInfo | undefined>;
    listServices(): Promise<ServiceInfo[]>;
    updateServiceHealth(serviceId: string, status: 'healthy' | 'unhealthy'): Promise<void>;
}
