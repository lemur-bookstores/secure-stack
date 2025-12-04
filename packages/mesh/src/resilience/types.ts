export interface RateLimiterConfig {
    maxRequests: number; // Max requests per window
    windowMs: number; // Time window in milliseconds
    blockDuration?: number; // How long to block after exceeding limit (ms)
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: Date;
    retryAfter?: number; // Seconds until can retry
}
