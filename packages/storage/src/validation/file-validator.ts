import { Readable } from 'stream';

export interface ValidationOptions {
    maxSize?: number; // in bytes
    allowedMimeTypes?: string[];
    custom?: (file: Buffer | Readable, metadata: any) => Promise<boolean | string>;
}

export class FileValidator {
    static async validate(
        file: Buffer | Readable,
        metadata: { size?: number; mimetype?: string;[key: string]: any },
        options: ValidationOptions
    ): Promise<void> {
        // Validate size
        if (options.maxSize && metadata.size && metadata.size > options.maxSize) {
            throw new Error(`File size exceeds limit of ${options.maxSize} bytes`);
        }

        // Validate mime type
        if (options.allowedMimeTypes && metadata.mimetype) {
            if (!options.allowedMimeTypes.includes(metadata.mimetype)) {
                throw new Error(`File type ${metadata.mimetype} is not allowed`);
            }
        }

        // Custom validation
        if (options.custom) {
            const result = await options.custom(file, metadata);
            if (result === false) {
                throw new Error('File validation failed');
            } else if (typeof result === 'string') {
                throw new Error(result);
            }
        }
    }
}
