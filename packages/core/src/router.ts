/**
 * Router builder for SecureStack
 */

import { ProcedureConfig, RouteType, ProcedureContext } from './types';
import { MiddlewareFunction } from './middleware';
import { SecureStackError } from './error';

export interface RouteDefinition {
    type: RouteType;
    config: ProcedureConfig;
}

export function router() {
    const routes: Map<string, RouteDefinition> = new Map();
    const middlewares: MiddlewareFunction[] = [];

    return {
        /**
         * Define a query procedure
         */
        query<TInput = unknown, TOutput = unknown>(name: string, config: ProcedureConfig<TInput, TOutput>) {
            routes.set(name, { type: RouteType.Query, config: config as ProcedureConfig });
            return this;
        },

        /**
         * Define a mutation procedure
         */
        mutation<TInput = unknown, TOutput = unknown>(name: string, config: ProcedureConfig<TInput, TOutput>) {
            routes.set(name, { type: RouteType.Mutation, config: config as ProcedureConfig });
            return this;
        },

        /**
         * Define a subscription procedure
         */
        subscription<TInput = unknown, TOutput = unknown>(name: string, config: ProcedureConfig<TInput, TOutput>) {
            routes.set(name, { type: RouteType.Subscription, config: config as ProcedureConfig });
            return this;
        },

        /**
         * Add middleware to this router
         */
        middleware(middleware: MiddlewareFunction) {
            middlewares.push(middleware);
            return this;
        },

        /**
         * Execute a procedure with input validation
         */
        async executeProcedure<TInput = unknown, TOutput = unknown, TContext = unknown>(
            procedureName: string,
            input: TInput,
            ctx: TContext
        ): Promise<TOutput> {
            const route = routes.get(procedureName);

            if (!route) {
                throw SecureStackError.notFound(`Procedure '${procedureName}' not found`);
            }

            const { config } = route;

            // Validate input if schema provided
            let validatedInput = input;
            if (config.input) {
                try {
                    validatedInput = config.input.parse(input) as TInput;
                } catch (error: any) {
                    throw SecureStackError.validationError('Input validation failed', {
                        errors: error.errors,
                        input,
                    });
                }
            }

            // Create procedure context
            const procedureContext: ProcedureContext<TInput, TContext> = {
                input: validatedInput,
                ctx,
            };

            // Execute handler
            try {
                const result = await (config.handler as any)(procedureContext);

                // Validate output if schema provided
                if (config.output) {
                    try {
                        return config.output.parse(result) as TOutput;
                    } catch (error: any) {
                        throw SecureStackError.internal('Output validation failed', error, {
                            errors: error.errors,
                            output: result,
                        });
                    }
                }

                return result as TOutput;
            } catch (error: any) {
                // Re-throw SecureStackError as-is
                if (error instanceof SecureStackError) {
                    throw error;
                }

                // Wrap other errors
                throw SecureStackError.internal('Procedure execution failed', error, {
                    procedure: procedureName,
                });
            }
        },

        /**
         * Get all routes
         */
        getRoutes() {
            return routes;
        },

        /**
         * Get all middlewares
         */
        getMiddlewares() {
            return middlewares;
        },
    };
}

export type Router = ReturnType<typeof router>;
