import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileManager } from '../files.js';
import fs from 'fs-extra';

vi.mock('fs-extra');

describe('FileManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('exists', () => {
        it('should return true if file exists', () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);
            expect(FileManager.exists('test-path')).toBe(true);
        });

        it('should return false if file does not exist', () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);
            expect(FileManager.exists('test-path')).toBe(false);
        });
    });

    describe('createDir', () => {
        it('should ensure directory exists', async () => {
            await FileManager.createDir('test-dir');
            expect(fs.ensureDir).toHaveBeenCalledWith('test-dir');
        });
    });

    describe('writeFile', () => {
        it('should write content to file', async () => {
            await FileManager.writeFile('test.txt', 'content');
            expect(fs.ensureDir).toHaveBeenCalledWith('.');
            expect(fs.writeFile).toHaveBeenCalledWith('test.txt', 'content', 'utf-8');
        });
    });

    describe('readJson', () => {
        it('should read json file', async () => {
            const mockJson = { key: 'value' };
            vi.mocked(fs.readJson).mockResolvedValue(mockJson);

            const result = await FileManager.readJson('test.json');
            expect(result).toEqual(mockJson);
            expect(fs.readJson).toHaveBeenCalledWith('test.json');
        });
    });
});
