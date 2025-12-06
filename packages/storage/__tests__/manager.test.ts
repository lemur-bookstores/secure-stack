import { describe, it, expect, vi } from 'vitest';
import { StorageManager } from '../src/manager.js';
import { LocalProvider } from '../src/providers/local.js';

// Mock LocalProvider to avoid file system operations during manager tests
vi.mock('../src/providers/local.js', () => {
    return {
        LocalProvider: vi.fn().mockImplementation(() => ({
            upload: vi.fn(),
            download: vi.fn(),
        })),
    };
});

describe('StorageManager', () => {
    it('should use local provider by default', () => {
        const manager = new StorageManager();
        expect(manager.getProvider()).toBeDefined();
    });

    it('should initialize with specific local config', () => {
        const manager = new StorageManager({
            local: { root: './custom-uploads' },
        });
        expect(LocalProvider).toHaveBeenCalledWith({ root: './custom-uploads' });
    });

    it('should throw error for unconfigured provider', () => {
        const manager = new StorageManager();
        expect(() => manager.getProvider('s3')).toThrow("Storage provider 's3' not configured");
    });

    it('should proxy methods to provider', async () => {
        const manager = new StorageManager();
        const provider = manager.getProvider();

        // Mock the upload method on the provider instance
        (provider.upload as any).mockResolvedValue({ path: 'test.txt' });

        await manager.upload(Buffer.from('test'), 'test.txt');
        expect(provider.upload).toHaveBeenCalled();
    });
});
