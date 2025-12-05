import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MongoProvider } from '../src/providers/mongo.js';
vi.mock('mongodb', () => {
    const mockCollection = {
        createIndex: vi.fn(),
        findOne: vi.fn(),
        updateOne: vi.fn(),
        deleteOne: vi.fn(),
        deleteMany: vi.fn(),
        countDocuments: vi.fn(),
    };
    const mockDb = {
        collection: vi.fn(() => mockCollection),
    };
    const mockClient = {
        connect: vi.fn(),
        db: vi.fn(() => mockDb),
        close: vi.fn(),
    };
    return {
        MongoClient: vi.fn(() => mockClient),
    };
});

describe('MongoProvider', () => {
    let provider: MongoProvider;
    let mockClient: any;
    let mockCollection: any;

    beforeEach(() => {
        vi.clearAllMocks();
        provider = new MongoProvider({ url: 'mongodb://localhost:27017' });
        // Access the mock client created by the constructor
        mockClient = (provider as any).client;
        // Trigger init
        provider.get('test');
        // Get the mock collection from the mock client
        mockCollection = mockClient.db().collection();
    });

    it('should get a value', async () => {
        mockCollection.findOne.mockResolvedValue({ key: 'key', value: 'value' });
        const result = await provider.get('key');
        expect(result).toBe('value');
        expect(mockCollection.findOne).toHaveBeenCalledWith({ key: 'key' });
    });

    it('should return null if key does not exist', async () => {
        mockCollection.findOne.mockResolvedValue(null);
        const result = await provider.get('key');
        expect(result).toBeNull();
    });

    it('should return null if expired', async () => {
        mockCollection.findOne.mockResolvedValue({ key: 'key', value: 'value', expiresAt: new Date(Date.now() - 1000) });
        const result = await provider.get('key');
        expect(result).toBeNull();
    });

    it('should set a value', async () => {
        await provider.set('key', 'value');
        expect(mockCollection.updateOne).toHaveBeenCalledWith(
            { key: 'key' },
            expect.objectContaining({ $set: expect.objectContaining({ key: 'key', value: 'value' }) }),
            { upsert: true }
        );
    });

    it('should delete a value', async () => {
        await provider.del('key');
        expect(mockCollection.deleteOne).toHaveBeenCalledWith({ key: 'key' });
    });

    it('should clear all values', async () => {
        await provider.clear();
        expect(mockCollection.deleteMany).toHaveBeenCalledWith({});
    });

    it('should check if key exists', async () => {
        mockCollection.countDocuments.mockResolvedValue(1);
        expect(await provider.has('key')).toBe(true);
        mockCollection.countDocuments.mockResolvedValue(0);
        expect(await provider.has('key')).toBe(false);
    });
});
