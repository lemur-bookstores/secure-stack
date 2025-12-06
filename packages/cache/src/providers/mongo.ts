import { MongoClient, Collection, Db } from 'mongodb';
import { CacheProvider } from '../interfaces/cache-provider.js';

export interface MongoConfig {
    url: string;
    dbName?: string;
    collectionName?: string;
    ttl?: number;
}

interface CacheDocument {
    key: string;
    value: any;
    expiresAt?: Date;
}

export class MongoProvider implements CacheProvider {
    private client: MongoClient;
    private db: Db | null = null;
    private collection: Collection<CacheDocument> | null = null;
    private defaultTtl: number;
    private config: MongoConfig;

    constructor(config: MongoConfig) {
        this.config = config;
        this.defaultTtl = config.ttl || 60;
        this.client = new MongoClient(config.url);
    }

    private async init(): Promise<void> {
        if (this.collection) return;

        await this.client.connect();
        this.db = this.client.db(this.config.dbName || 'cache');
        this.collection = this.db.collection(this.config.collectionName || 'items');

        // Create index for TTL
        await this.collection.createIndex({ key: 1 }, { unique: true });
        await this.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    }

    async get<T>(key: string): Promise<T | null> {
        await this.init();
        const doc = await this.collection!.findOne({ key });

        if (!doc) return null;

        // MongoDB TTL index handles expiration, but we double check just in case
        if (doc.expiresAt && doc.expiresAt < new Date()) {
            return null;
        }

        return doc.value as T;
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        await this.init();
        const finalTtl = ttl || this.defaultTtl;
        const expiresAt = finalTtl ? new Date(Date.now() + finalTtl * 1000) : undefined;

        await this.collection!.updateOne(
            { key },
            { $set: { key, value, expiresAt } },
            { upsert: true }
        );
    }

    async del(key: string): Promise<void> {
        await this.init();
        await this.collection!.deleteOne({ key });
    }

    async clear(): Promise<void> {
        await this.init();
        await this.collection!.deleteMany({});
    }

    async has(key: string): Promise<boolean> {
        await this.init();
        const count = await this.collection!.countDocuments({
            key,
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: new Date() } }
            ]
        });
        return count > 0;
    }

    /**
     * Get the underlying MongoDB client
     */
    getClient(): MongoClient {
        return this.client;
    }

    /**
     * Close the connection
     */
    async disconnect(): Promise<void> {
        await this.client.close();
    }
}
