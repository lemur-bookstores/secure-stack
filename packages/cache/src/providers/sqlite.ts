import Database from 'better-sqlite3';
import { CacheProvider } from '../interfaces/cache-provider.js';
import path from 'path';
import fs from 'fs';

export interface SqliteConfig {
    path?: string;
    table?: string;
    ttl?: number;
}

export class SqliteProvider implements CacheProvider {
    private db: Database.Database;
    private table: string;
    private defaultTtl: number;

    constructor(config: SqliteConfig = {}) {
        const dbPath = config.path || ':memory:';
        this.table = config.table || 'cache';
        this.defaultTtl = config.ttl || 60;

        if (dbPath !== ':memory:') {
            const dir = path.dirname(dbPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }

        this.db = new Database(dbPath);
        this.init();
    }

    private init() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.table} (
        key TEXT PRIMARY KEY,
        value TEXT,
        expires_at INTEGER
      )
    `);

        // Create index on expires_at for faster cleanup
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_expires_at ON ${this.table} (expires_at)`);
    }

    async get<T>(key: string): Promise<T | null> {
        const now = Date.now();
        const stmt = this.db.prepare(`SELECT value, expires_at FROM ${this.table} WHERE key = ?`);
        const row = stmt.get(key) as { value: string; expires_at: number } | undefined;

        if (!row) return null;

        if (row.expires_at && row.expires_at < now) {
            this.del(key); // Lazy expiration
            return null;
        }

        try {
            return JSON.parse(row.value) as T;
        } catch {
            return row.value as unknown as T;
        }
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        const finalTtl = ttl || this.defaultTtl;
        const expiresAt = finalTtl ? Date.now() + finalTtl * 1000 : null;

        const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ${this.table} (key, value, expires_at)
      VALUES (?, ?, ?)
    `);

        stmt.run(key, stringValue, expiresAt);
    }

    async del(key: string): Promise<void> {
        const stmt = this.db.prepare(`DELETE FROM ${this.table} WHERE key = ?`);
        stmt.run(key);
    }

    async clear(): Promise<void> {
        this.db.exec(`DELETE FROM ${this.table}`);
    }

    async has(key: string): Promise<boolean> {
        const now = Date.now();
        const stmt = this.db.prepare(`SELECT expires_at FROM ${this.table} WHERE key = ?`);
        const row = stmt.get(key) as { expires_at: number } | undefined;

        if (!row) return false;

        if (row.expires_at && row.expires_at < now) {
            this.del(key);
            return false;
        }

        return true;
    }

    /**
     * Clean up expired items
     */
    async cleanup(): Promise<void> {
        const now = Date.now();
        const stmt = this.db.prepare(`DELETE FROM ${this.table} WHERE expires_at < ?`);
        stmt.run(now);
    }

    /**
     * Get the underlying SQLite database instance
     */
    getDatabase(): Database.Database {
        return this.db;
    }

    /**
     * Close the database connection
     */
    async disconnect(): Promise<void> {
        this.db.close();
    }
}
