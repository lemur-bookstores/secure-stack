import { StorageProvider, FileMetadata, UploadOptions } from '../interfaces/storage-provider.js';
import fs from 'fs-extra';
import path from 'path';
import { Readable } from 'stream';

export interface LocalConfig {
    root: string;
    baseUrl?: string;
}

export class LocalProvider implements StorageProvider {
    private root: string;
    private baseUrl: string;

    constructor(config: LocalConfig) {
        this.root = path.resolve(config.root);
        this.baseUrl = config.baseUrl || 'file://';
        fs.ensureDirSync(this.root);
    }

    async upload(file: Buffer | Readable | string | NodeJS.ArrayBufferView, filePath: string, options?: UploadOptions): Promise<FileMetadata> {
        const fullPath = path.join(this.root, filePath);
        await fs.ensureDir(path.dirname(fullPath));

        if (file instanceof Readable) {
            const writeStream = fs.createWriteStream(fullPath);
            await new Promise((resolve, reject) => {
                file.pipe(writeStream);
                writeStream.on('finish', () => resolve({}));
                writeStream.on('error', reject);
            });
        } else {
            await fs.writeFile(fullPath, file as Uint8Array);
        }

        const stats = await fs.stat(fullPath);
        const url = await this.getUrl(filePath);

        return {
            url,
            path: filePath,
            size: stats.size,
            mimetype: options?.mimetype,
            lastModified: stats.mtime,
        };
    }

    async download(filePath: string): Promise<Buffer> {
        const fullPath = path.join(this.root, filePath);
        if (!await fs.pathExists(fullPath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        return fs.readFile(fullPath);
    }

    async getStream(filePath: string): Promise<Readable> {
        const fullPath = path.join(this.root, filePath);
        if (!await fs.pathExists(fullPath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        return fs.createReadStream(fullPath);
    }

    async delete(filePath: string): Promise<void> {
        const fullPath = path.join(this.root, filePath);
        if (await fs.pathExists(fullPath)) {
            await fs.remove(fullPath);
        }
    }

    async exists(filePath: string): Promise<boolean> {
        const fullPath = path.join(this.root, filePath);
        return fs.pathExists(fullPath);
    }

    async getUrl(filePath: string): Promise<string> {
        if (this.baseUrl.startsWith('http')) {
            return new URL(filePath, this.baseUrl).toString();
        }
        return `${this.baseUrl}${filePath}`;
    }
}
