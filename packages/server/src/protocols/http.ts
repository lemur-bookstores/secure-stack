/**
 * HTTP Protocol for SecureStack
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { Router } from '@lemur-bookstores/core';
import { SecureStackError } from '@lemur-bookstores/core';

export interface HTTPRouterOptions {
    prefix?: string;
}

export function createHealthCheck() {
    return {
        status: 'ok',
        timestamp: new Date().toISOString(),
    };
}

/**
 * Register a SecureStack router as HTTP endpoints
 */
export function registerHTTPRouter(
    fastify: FastifyInstance,
    router: Router,
    options: HTTPRouterOptions = {},
    extraContext: Record<string, any> = {}
) {
    const { prefix = '' } = options;
    const routes = router.getRoutes();

    routes.forEach((route, name) => {
        const path = `${prefix}/${name}`;
        const method = route.type === 'mutation' ? 'POST' : 'GET';

        if (method === 'GET') {
            fastify.get(path, async (request: FastifyRequest, reply: FastifyReply) => {
                try {
                    // Get input from query params
                    const input = request.query;

                    // Create context from request
                    const ctx = {
                        req: request,
                        res: reply,
                        headers: request.headers as Record<string, string>,
                        ...extraContext,
                    };

                    // Execute procedure
                    const result = await router.executeProcedure(name, input, ctx);

                    return result;
                } catch (error: any) {
                    if (error instanceof SecureStackError) {
                        return reply.status(error.status).send({
                            error: {
                                code: error.code,
                                message: error.message,
                                meta: error.meta,
                            },
                        });
                    } else {
                        return reply.status(500).send({
                            error: {
                                code: 'INTERNAL_ERROR',
                                message: error.message || 'Internal server error',
                            },
                        });
                    }
                }
            });
        } else {
            fastify.post(path, async (request: FastifyRequest, reply: FastifyReply) => {
                try {
                    // Get input from body
                    const input = request.body;

                    // Create context from request
                    const ctx = {
                        req: request,
                        res: reply,
                        headers: request.headers as Record<string, string>,
                        ...extraContext,
                    };

                    // Execute procedure
                    const result = await router.executeProcedure(name, input, ctx);

                    return result;
                } catch (error: any) {
                    if (error instanceof SecureStackError) {
                        return reply.status(error.status).send({
                            error: {
                                code: error.code,
                                message: error.message,
                                meta: error.meta,
                            },
                        });
                    } else {
                        return reply.status(500).send({
                            error: {
                                code: 'INTERNAL_ERROR',
                                message: error.message || 'Internal server error',
                            },
                        });
                    }
                }
            });
        }

        console.log(`[HTTP] Registered ${method} ${path}`);
    });
}

