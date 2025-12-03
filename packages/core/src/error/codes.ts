/**
 * Error codes for SecureStack
 */

export enum ErrorCode {
    // Client errors (4xx)
    BAD_REQUEST = 'BAD_REQUEST',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
    CONFLICT = 'CONFLICT',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

    // Server errors (5xx)
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
    TIMEOUT = 'TIMEOUT',

    // Custom errors
    PROCEDURE_NOT_FOUND = 'PROCEDURE_NOT_FOUND',
    INVALID_INPUT = 'INVALID_INPUT',
    INVALID_OUTPUT = 'INVALID_OUTPUT',
}

/**
 * HTTP status codes mapping
 */
export const ErrorCodeToStatus: Record<ErrorCode, number> = {
    [ErrorCode.BAD_REQUEST]: 400,
    [ErrorCode.UNAUTHORIZED]: 401,
    [ErrorCode.FORBIDDEN]: 403,
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.METHOD_NOT_ALLOWED]: 405,
    [ErrorCode.CONFLICT]: 409,
    [ErrorCode.VALIDATION_ERROR]: 422,
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
    [ErrorCode.INTERNAL_ERROR]: 500,
    [ErrorCode.NOT_IMPLEMENTED]: 501,
    [ErrorCode.SERVICE_UNAVAILABLE]: 503,
    [ErrorCode.TIMEOUT]: 504,
    [ErrorCode.PROCEDURE_NOT_FOUND]: 404,
    [ErrorCode.INVALID_INPUT]: 400,
    [ErrorCode.INVALID_OUTPUT]: 500,
};
