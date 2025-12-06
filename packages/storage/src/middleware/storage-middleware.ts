import busboy from 'busboy';
import { IncomingMessage } from 'http';
import { StorageManager, ExtendedUploadOptions } from '../manager.js';
import { FileMetadata } from '../interfaces/storage-provider.js';

export interface MiddlewareOptions extends ExtendedUploadOptions {
    storageManager: StorageManager;
    path?: string | ((file: any) => string);
}

export class StorageMiddleware {
    constructor(private options: MiddlewareOptions) { }

    /**
     * Handle a multipart request
     */
    async handle(req: IncomingMessage): Promise<FileMetadata[]> {
        return new Promise((resolve, reject) => {
            const bb = busboy({ headers: req.headers });
            const uploads: Promise<FileMetadata>[] = [];

            bb.on('file', (name, file, info) => {
                const { filename, mimeType } = info;
                const path = typeof this.options.path === 'function'
                    ? this.options.path({ name, filename, mimeType })
                    : (this.options.path || filename);

                const uploadPromise = this.options.storageManager.upload(file, path, {
                    ...this.options,
                    mimetype: mimeType,
                    metadata: {
                        originalName: filename,
                        fieldName: name,
                        ...this.options.metadata,
                    },
                });

                uploads.push(uploadPromise);
            });

            bb.on('error', reject);
            bb.on('finish', async () => {
                try {
                    const results = await Promise.all(uploads);
                    resolve(results);
                } catch (error) {
                    reject(error);
                }
            });

            req.pipe(bb);
        });
    }
}
