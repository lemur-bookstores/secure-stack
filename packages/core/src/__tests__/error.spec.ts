/**
 * Tests for Error handling
 */

import { describe, it, expect } from 'vitest';
import { SecureStackError } from '../error/SecureStackError';
import { ErrorCode } from '../error/codes';

describe('SecureStackError', () => {
    describe('Constructor', () => {
        it('should create error with all properties', () => {
            const error = new SecureStackError({
                message: 'Test error',
                code: ErrorCode.BAD_REQUEST,
                meta: { field: 'email' },
            });

            expect(error.message).toBe('Test error');
            expect(error.code).toBe(ErrorCode.BAD_REQUEST);
            expect(error.status).toBe(400);
            expect(error.meta).toEqual({ field: 'email' });
            expect(error.name).toBe('SecureStackError');
        });

        it('should capture cause error', () => {
            const cause = new Error('Original error');
            const error = new SecureStackError({
                message: 'Wrapped error',
                code: ErrorCode.INTERNAL_ERROR,
                cause,
            });

            expect(error.cause).toBe(cause);
        });

        it('should have proper stack trace', () => {
            const error = new SecureStackError({
                message: 'Test',
                code: ErrorCode.BAD_REQUEST,
            });

            expect(error.stack).toBeDefined();
            expect(error.stack).toContain('SecureStackError');
        });
    });

    describe('Factory Methods', () => {
        it('should create BAD_REQUEST error', () => {
            const error = SecureStackError.badRequest('Invalid input');

            expect(error.code).toBe(ErrorCode.BAD_REQUEST);
            expect(error.status).toBe(400);
            expect(error.message).toBe('Invalid input');
        });

        it('should create UNAUTHORIZED error', () => {
            const error = SecureStackError.unauthorized();

            expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
            expect(error.status).toBe(401);
            expect(error.message).toBe('Unauthorized');
        });

        it('should create UNAUTHORIZED error with custom message', () => {
            const error = SecureStackError.unauthorized('Token expired');

            expect(error.message).toBe('Token expired');
        });

        it('should create FORBIDDEN error', () => {
            const error = SecureStackError.forbidden();

            expect(error.code).toBe(ErrorCode.FORBIDDEN);
            expect(error.status).toBe(403);
        });

        it('should create NOT_FOUND error', () => {
            const error = SecureStackError.notFound('User not found');

            expect(error.code).toBe(ErrorCode.NOT_FOUND);
            expect(error.status).toBe(404);
            expect(error.message).toBe('User not found');
        });

        it('should create VALIDATION_ERROR', () => {
            const error = SecureStackError.validationError('Email is invalid', {
                field: 'email',
            });

            expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
            expect(error.status).toBe(422);
            expect(error.meta?.field).toBe('email');
        });

        it('should create INTERNAL_ERROR', () => {
            const cause = new Error('Database connection failed');
            const error = SecureStackError.internal(
                'Failed to fetch user',
                cause,
                { userId: '123' }
            );

            expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
            expect(error.status).toBe(500);
            expect(error.cause).toBe(cause);
            expect(error.meta?.userId).toBe('123');
        });

        it('should create INTERNAL_ERROR with default message', () => {
            const error = SecureStackError.internal();

            expect(error.message).toBe('Internal server error');
        });
    });

    describe('toJSON', () => {
        it('should convert error to JSON', () => {
            const error = SecureStackError.badRequest('Invalid input', {
                field: 'email',
            });

            const json = error.toJSON();

            expect(json).toEqual({
                name: 'SecureStackError',
                message: 'Invalid input',
                code: ErrorCode.BAD_REQUEST,
                status: 400,
                meta: { field: 'email' },
                stack: expect.any(String),
            });
        });

        it('should include cause in JSON if present', () => {
            const cause = new Error('Original error');
            const error = new SecureStackError({
                message: 'Wrapped',
                code: ErrorCode.INTERNAL_ERROR,
                cause,
            });

            const json = error.toJSON();
            expect(json.stack).toBeDefined();
        });
    });

    describe('Status Code Mapping', () => {
        it('should map BAD_REQUEST to 400', () => {
            const error = SecureStackError.badRequest('Test');
            expect(error.status).toBe(400);
        });

        it('should map UNAUTHORIZED to 401', () => {
            const error = SecureStackError.unauthorized();
            expect(error.status).toBe(401);
        });

        it('should map FORBIDDEN to 403', () => {
            const error = SecureStackError.forbidden();
            expect(error.status).toBe(403);
        });

        it('should map NOT_FOUND to 404', () => {
            const error = SecureStackError.notFound();
            expect(error.status).toBe(404);
        });

        it('should map VALIDATION_ERROR to 422', () => {
            const error = SecureStackError.validationError('Test');
            expect(error.status).toBe(422);
        });

        it('should map INTERNAL_ERROR to 500', () => {
            const error = SecureStackError.internal();
            expect(error.status).toBe(500);
        });
    });

    describe('Error Inheritance', () => {
        it('should be instance of Error', () => {
            const error = SecureStackError.badRequest('Test');
            expect(error instanceof Error).toBe(true);
        });

        it('should be instance of SecureStackError', () => {
            const error = SecureStackError.badRequest('Test');
            expect(error instanceof SecureStackError).toBe(true);
        });

        it('should work with try-catch', () => {
            try {
                throw SecureStackError.unauthorized();
            } catch (error) {
                expect(error).toBeInstanceOf(SecureStackError);
                expect((error as SecureStackError).code).toBe(ErrorCode.UNAUTHORIZED);
            }
        });
    });
});
