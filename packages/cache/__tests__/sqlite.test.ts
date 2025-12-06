import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SqliteProvider } from '../src/providers/sqlite.js';
import Database from 'better-sqlite3';

vi.mock('better-sqlite3', () => {
    const mockDb = {
        exec: vi.fn(),
        prepare: vi.fn(),
        close: vi.fn(),
    };
    return {
        default: vi.fn(() => mockDb),
    };
});

describe('SqliteProvider', () => {
    let provider: SqliteProvider;
    let mockDb: any;
    let mockStmt: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockStmt = {
            run: vi.fn(),
            get: vi.fn(),
        };
        mockDb = new Database(':memory:');
        mockDb.prepare.mockReturnValue(mockStmt);
        provider = new SqliteProvider();
    });

    it('should initialize database', () => {
        expect(mockDb.exec).toHaveBeenCalled();
    });

    it('should get a value', async () => {
        mockStmt.get.mockReturnValue({ value: '"value"', expires_at: Date.now() + 10000 });
        const result = await provider.get('key');
        expect(result).toBe('value');
        expect(mockStmt.get).toHaveBeenCalledWith('key');
    });

    it('should return null if key does not exist', async () => {
        mockStmt.get.mockReturnValue(undefined);
        const result = await provider.get('key');
        expect(result).toBeNull();
    });

    it('should return null if expired', async () => {
        mockStmt.get.mockReturnValue({ value: '"value"', expires_at: Date.now() - 1000 });
        const result = await provider.get('key');
        expect(result).toBeNull();
        expect(mockStmt.run).toHaveBeenCalledWith('key'); // Deletes expired
    });

    it('should set a value', async () => {
        await provider.set('key', 'value');
        // Expect raw string 'value' not '"value"' because we fixed the implementation to handle strings
        expect(mockStmt.run).toHaveBeenCalledWith('key', 'value', expect.any(Number));
    });

    it('should delete a value', async () => {
        await provider.del('key');
        expect(mockStmt.run).toHaveBeenCalledWith('key');
    });

    it('should clear all values', async () => {
        await provider.clear();
        expect(mockDb.exec).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'));
    });
});
