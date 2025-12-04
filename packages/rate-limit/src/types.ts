export interface RateLimitConfig {
    windowMs: number;
    max: number;
    message?: string;
    statusCode?: number;
    headers?: boolean;
    keyGenerator?: (req: any) => string;
    store?: RateLimitStore;
}

export interface RateLimitStore {
    increment(key: string): Promise<RateLimitInfo>;
    decrement(key: string): Promise<void>;
    resetKey(key: string): Promise<void>;
}

export interface RateLimitInfo {
    totalHits: number;
    resetTime: Date;
}
