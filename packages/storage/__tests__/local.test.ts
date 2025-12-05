import fs from 'fs-extra';
import path from 'path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LocalProvider } from '../src/providers/local.js';

vi.mock('fs-extra');

describe('LocalProvider', () => {
    const root = '/tmp/uploads';
    let provider: LocalProvider;

    beforeEach(() => {
        vi.clearAllMocks();
        (fs.ensureDirSync as any).mockReturnValue(undefined);
        provider = new LocalProvider({ root });
    });

    it('should initialize correctly', () => {
        expect(fs.ensureDirSync).toHaveBeenCalledWith(path.resolve(root));
    });

    it('should upload a buffer', async () => {
        const file = Buffer.from('test content');
        const filePath = 'test.txt';
        const fullPath = path.resolve(root, filePath);

        (fs.ensureDir as any).mockResolvedValue(undefined);
        (fs.writeFile as any).mockResolvedValue(undefined);
        (fs.stat as any).mockResolvedValue({ size: file.length, mtime: new Date() });

        const result = await provider.upload(file, filePath);

        expect(fs.ensureDir).toHaveBeenCalledWith(path.dirname(fullPath));
        expect(fs.writeFile).toHaveBeenCalledWith(fullPath, file);
        expect(result.path).toBe(filePath);
        expect(result.size).toBe(file.length);
    });

    it('should download a file', async () => {
        const filePath = 'test.txt';
        const fullPath = path.resolve(root, filePath);
        const content = Buffer.from('test content');

        (fs.pathExists as any).mockResolvedValue(true);
        (fs.readFile as any).mockResolvedValue(content);

        const result = await provider.download(filePath);

        expect(fs.readFile).toHaveBeenCalledWith(fullPath);
        expect(result).toBe(content);
    });

    it('should throw error if file to download does not exist', async () => {
        (fs.pathExists as any).mockResolvedValue(false);
        await expect(provider.download('nonexistent.txt')).rejects.toThrow('File not found');
    });

    it('should delete a file', async () => {
        const filePath = 'test.txt';
        const fullPath = path.resolve(root, filePath);

        (fs.pathExists as any).mockResolvedValue(true);
        (fs.remove as any).mockResolvedValue(undefined);

        await provider.delete(filePath);

        expect(fs.remove).toHaveBeenCalledWith(fullPath);
    });

    it('should check if file exists', async () => {
        const filePath = 'test.txt';
        (fs.pathExists as any).mockResolvedValue(true);
        expect(await provider.exists(filePath)).toBe(true);
    });

    it('should get correct url', async () => {
        expect(await provider.getUrl('test.txt')).toBe('file://test.txt');

        const httpProvider = new LocalProvider({ root, baseUrl: 'http://localhost:3000/uploads/' });
        expect(await httpProvider.getUrl('test.txt')).toBe('http://localhost:3000/uploads/test.txt');
    });
});
