import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { meshStatus, meshHealth } from '../mesh';

// Mock logger to avoid cluttering output
vi.mock('../../utils/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        success: vi.fn(),
        newLine: vi.fn(),
        box: vi.fn(),
    }
}));

// Mock ora
vi.mock('ora', () => {
    return {
        default: () => ({
            start: () => ({
                succeed: vi.fn(),
                fail: vi.fn(),
                stop: vi.fn(),
            })
        })
    };
});

describe('Mesh Commands', () => {
    const mockUrl = 'http://localhost:3000';

    beforeEach(() => {
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('meshStatus should fetch status successfully', async () => {
        const mockResponse = { status: 'ok', service: 'test-service' };
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse,
        });

        await meshStatus({ url: mockUrl });

        expect(global.fetch).toHaveBeenCalledWith(`${mockUrl}/mesh/status`, undefined);
    });

    it('meshHealth should fetch health successfully', async () => {
        const mockResponse = { status: 'healthy' };
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse,
        });

        await meshHealth({ url: mockUrl });

        expect(global.fetch).toHaveBeenCalledWith(`${mockUrl}/health`, undefined);
    });

    it('should handle fetch errors', async () => {
        (global.fetch as any).mockRejectedValue(new Error('Network error'));

        await meshStatus({ url: mockUrl });
        // Should not throw, but log error (which is mocked)
    });
});
