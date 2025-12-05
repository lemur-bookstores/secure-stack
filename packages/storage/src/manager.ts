import { StorageProvider, FileMetadata, UploadOptions } from './interfaces/storage-provider.js';
import { LocalProvider, LocalConfig } from './providers/local.js';
import { S3Provider, S3Config } from './providers/s3.js';
import { Readable } from 'stream';

export type StorageType = 'local' | 's3';

export interface StorageConfig {
    default?: StorageType;
    local?: LocalConfig;
    s3?: S3Config;
}

export class StorageManager {
    private providers: Map<string, StorageProvider> = new Map();
    private defaultProvider: string;

    constructor(config: StorageConfig = {}) {
        this.defaultProvider = config.default || 'local';

        if (config.local) {
            this.providers.set('local', new LocalProvider(config.local));
        } else if (this.defaultProvider === 'local') {
            // Default local config if not provided
            this.providers.set('local', new LocalProvider({ root: './uploads' }));
        }

        if (config.s3) {
            this.providers.set('s3', new S3Provider(config.s3));
        }
    }

    /**
     * Get a specific provider
     * @param name The name of the provider (e.g., 'local', 's3')
     */
    getProvider(name?: string): StorageProvider {
        const providerName = name || this.defaultProvider;
        const provider = this.providers.get(providerName);

        if (!provider) {
            throw new Error(`Storage provider '${providerName}' not configured`);
        }

        return provider;
    }

    /**
     * Upload a file using the default provider
     */
    async upload(file: Buffer | Readable, path: string, options?: UploadOptions): Promise<FileMetadata> {
        return this.getProvider().upload(file, path, options);
    }

    /**
     * Download a file using the default provider
     */
    async download(path: string): Promise<Buffer> {
        return this.getProvider().download(path);
    }

    /**
   * Get a stream using the default provider
   */
    async getStream(path: string): Promise<Readable> {
        return this.getProvider().getStream(path);
    }

    /**
     * Delete a file using the default provider
     */
    async delete(path: string): Promise<void> {
        return this.getProvider().delete(path);
    }

    /**
     * Check if a file exists using the default provider
     */
    async exists(path: string): Promise<boolean> {
        return this.getProvider().exists(path);
    }

    /**
     * Get a public URL using the default provider
     */
    async getUrl(path: string): Promise<string> {
        return this.getProvider().getUrl(path);
    }
}
