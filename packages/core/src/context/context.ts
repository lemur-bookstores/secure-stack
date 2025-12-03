/**
 * Context builder for SecureStack
 */

/**
 * Default context type with common properties
 */
export interface DefaultContext {
    req?: any;
    res?: any;
    user?: {
        id: string;
        [key: string]: any;
    };
    session?: {
        id: string;
        [key: string]: any;
    };
    headers?: Record<string, string>;
    [key: string]: any;
}

export interface ContextBuilder<TContext = any> {
    create: (initialContext?: Partial<TContext>) => TContext;
    extend: <TExtension>(extension: TExtension) => ContextBuilder<TContext & TExtension>;
}

/**
 * Create a context builder
 */
export function createContext<TContext = DefaultContext>(
    factory?: (initial?: Partial<TContext>) => TContext
): ContextBuilder<TContext> {
    let contextFactory: (initial?: Partial<TContext>) => TContext = factory || ((initial) => {
        return { ...initial } as TContext;
    });

    return {
        create: (initialContext?: Partial<TContext>) => {
            return contextFactory(initialContext);
        },
        extend: <TExtension>(extension: TExtension) => {
            const previousFactory = contextFactory;
            const newFactory = (initial?: Partial<TContext>) => {
                const baseContext = previousFactory(initial);
                return { ...baseContext, ...extension } as TContext & TExtension;
            };
            return createContext<TContext & TExtension>(newFactory as any);
        },
    };
}
