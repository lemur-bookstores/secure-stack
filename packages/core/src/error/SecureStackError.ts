/**
 * Base error class for SecureStack
 */

import { ErrorCode, ErrorCodeToStatus } from './codes';

export class SecureStackError extends Error {
    public readonly code: ErrorCode;
    public readonly status: number;
    public override readonly cause?: Error;
    public readonly meta?: Record<string, any>;

    constructor(options: {
        message: string;
        code: ErrorCode;
        cause?: Error;
        meta?: Record<string, any>;
    }) {
        super(options.message);

        this.name = 'SecureStackError';
        this.code = options.code;
        this.status = ErrorCodeToStatus[options.code];
        this.cause = options.cause;
        this.meta = options.meta;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, SecureStackError);
        }
    }

    /**
     * Convert error to JSON
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            status: this.status,
            meta: this.meta,
            stack: this.stack,
        };
    }

    /**
     * Create a BAD_REQUEST error
     */
    static badRequest(message: string, meta?: Record<string, any>) {
        return new SecureStackError({
            message,
            code: ErrorCode.BAD_REQUEST,
            meta,
        });
    }

    /**
     * Create an UNAUTHORIZED error
     */
    static unauthorized(message: string = 'Unauthorized', meta?: Record<string, any>) {
        return new SecureStackError({
            message,
            code: ErrorCode.UNAUTHORIZED,
            meta,
        });
    }

    /**
     * Create a FORBIDDEN error
     */
    static forbidden(message: string = 'Forbidden', meta?: Record<string, any>) {
        return new SecureStackError({
            message,
            code: ErrorCode.FORBIDDEN,
            meta,
        });
    }

    /**
     * Create a NOT_FOUND error
     */
    static notFound(message: string = 'Not found', meta?: Record<string, any>) {
        return new SecureStackError({
            message,
            code: ErrorCode.NOT_FOUND,
            meta,
        });
    }

    /**
     * Create a CONFLICT error
     */
    static conflict(message: string = 'Conflict', meta?: Record<string, any>) {
        return new SecureStackError({
            message,
            code: ErrorCode.CONFLICT,
            meta,
        });
    }

    /**
     * Create a VALIDATION_ERROR
     */
    static validationError(message: string, meta?: Record<string, any>) {
        return new SecureStackError({
            message,
            code: ErrorCode.VALIDATION_ERROR,
            meta,
        });
    }

    /**
     * Create an INTERNAL_ERROR
     */
    static internal(message: string = 'Internal server error', cause?: Error, meta?: Record<string, any>) {
        return new SecureStackError({
            message,
            code: ErrorCode.INTERNAL_ERROR,
            cause,
            meta,
        });
    }
}
