import { RateLimitStore, RateLimitInfo } from '../types';

export interface SQLiteClient {
    run(sql: string, ...params: any[]): Promise<any>;
    get(sql: string, ...params: any[]): Promise<any>;
}

export class SQLiteStore implements RateLimitStore {
    private db: SQLiteClient;
    private windowMs: number;
    private tableName: string;

    constructor(db: SQLiteClient, windowMs: number, tableName: string = 'rate_limits') {
        this.db = db;
        this.windowMs = windowMs;
        this.tableName = tableName;
        // Initialize table asynchronously
        this.init().catch(console.error);
    }

    private async init() {
        await this.db.run(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        key TEXT PRIMARY KEY,
        hits INTEGER,
        reset_time INTEGER
      )
    `);
    }

    async increment(key: string): Promise<RateLimitInfo> {
        const now = Date.now();

        // Delete if expired to ensure we start fresh
        await this.db.run(
            `DELETE FROM ${this.tableName} WHERE key = ? AND reset_time <= ?`,
            key,
            now
        );

        const resetTime = now + this.windowMs;

        // Insert or Update (UPSERT)
        // If key exists (and wasn't deleted above, meaning it's valid), increment hits.
        // If key doesn't exist (new or deleted above), insert with hits=1.
        // Note: We don't update reset_time on conflict, we keep the original window.
        await this.db.run(
            `INSERT INTO ${this.tableName} (key, hits, reset_time) 
       VALUES (?, 1, ?) 
       ON CONFLICT(key) DO UPDATE SET hits = hits + 1`,
            key,
            resetTime
        );

        const result = await this.db.get(
            `SELECT hits, reset_time FROM ${this.tableName} WHERE key = ?`,
            key
        );

        return {
            totalHits: result ? result.hits : 1,
            resetTime: result ? new Date(result.reset_time) : new Date(resetTime),
        };
    }

    async decrement(key: string): Promise<void> {
        await this.db.run(
            `UPDATE ${this.tableName} SET hits = hits - 1 WHERE key = ? AND hits > 0`,
            key
        );
    }

    async resetKey(key: string): Promise<void> {
        await this.db.run(`DELETE FROM ${this.tableName} WHERE key = ?`, key);
    }
}
