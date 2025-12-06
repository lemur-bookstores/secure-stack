/**
 * Type definitions for SecureStack Core
 */

/**
 * Service type enum
 */
export enum ServiceType {
    Microservice = 'microservice',
    Gateway = 'gateway',
}

/**
 * Encryption mode enum
 */
export enum EncryptionMode {
    Hybrid = 'hybrid',
    TLS = 'tls',
    None = 'none',
}

/**
 * Service discovery mode enum
 */
export enum DiscoveryMode {
    Static = 'static',
    DNS = 'dns',
    Consul = 'consul',
    Etcd = 'etcd',
}

export enum RouteType {
    Query = 'query',
    Mutation = 'mutation',
    Subscription = 'subscription',
}

export interface SecureStackConfig {
    name: string;
    port: number;
    type?: ServiceType;
    mesh?: MeshConfig;
}

export interface MeshConfig {
    enabled: boolean;
    security?: {
        encryption?: EncryptionMode;
        rsaKeySize?: number;
        aesKeySize?: number;
        keyRotationInterval?: number;
    };
    discovery?: {
        mode?: DiscoveryMode;
        services?: ServiceDefinition[];
    };
}

export interface ServiceDefinition {
    id: string;
    host: string;
    port: number;
}

import { z } from 'zod';
import { MiddlewareFunction } from './middleware';
import type { DefaultContext } from './context';

export interface RouterConfig {
    name: string;
    middleware?: MiddlewareFunction[];
}

export interface ProcedureConfig<TInput = any, TOutput = unknown, TContext = DefaultContext> {
    input?: TInput;
    output?: z.ZodType<TOutput>;
    handler: (ctx: ProcedureContext<TInput, TContext>) => Promise<TOutput> | TOutput;
}

export interface ProcedureContext<TInput = unknown, TContext = DefaultContext> {
    input: TInput;
    ctx: TContext;
}
