import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRealtime } from '../src/provider';

// Mock RealtimeManager
vi.mock('../src/manager', () => {
    return {
        RealtimeManager: vi.fn().mockImplementation(() => ({
            getServer: vi.fn().mockReturnValue({
                use: vi.fn(),
            }),
        })),
    };
});

describe('useRealtime', () => {
    let mockServer: any;
    let mockAuth: any;

    beforeEach(() => {
        mockAuth = {
            jwt: {
                verifyToken: vi.fn(),
            },
        };
        mockServer = {
            getHttpServer: vi.fn().mockReturnValue({}),
            registerProvider: vi.fn(),
            auth: mockAuth,
        };
        vi.clearAllMocks();
    });

    it('should auto-configure auth by default when auth module is present', () => {
        const realtime = useRealtime(mockServer, {});

        expect(realtime.getServer().use).toHaveBeenCalled();
    });

    it('should NOT configure auth when config.auth is false', () => {
        const realtime = useRealtime(mockServer, { auth: false });

        expect(realtime.getServer().use).not.toHaveBeenCalled();
    });

    it('should NOT configure auth when server.auth is missing', () => {
        mockServer.auth = undefined;
        const realtime = useRealtime(mockServer, {});

        expect(realtime.getServer().use).not.toHaveBeenCalled();
    });
});
