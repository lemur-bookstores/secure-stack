import { describe, it, expect, vi } from 'vitest';
import { StorageMiddleware } from '../src/middleware/storage-middleware.js';

// Mock busboy to avoid runtime errors during instantiation if it's called
vi.mock('busboy', () => {
    return {
        default: vi.fn(() => ({
            on: vi.fn(),
        })),
    };
});

describe('StorageMiddleware', () => {
    it('should be defined', () => {
        const manager: any = {};
        const middleware = new StorageMiddleware({ storageManager: manager });
        expect(middleware).toBeDefined();
        expect(middleware.handle).toBeDefined();
    });
});
