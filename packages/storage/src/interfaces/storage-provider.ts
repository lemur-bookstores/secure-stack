import { Readable } from 'stream';

export interface FileMetadata {
    path: string;
    url?: string;
    size?: number;
    mimetype?: string;
    lastModified?: Date;
}

export interface UploadOptions {
    mimetype?: string;
    metadata?: Record<string, any>;
}

export interface StorageProvider {
    /**
     * Upload a file to storage
     * @param file The file content (Buffer or Stream)
     * @param path The destination path
     * @param options Upload options
     */
    upload(file: Buffer | Readable, path: string, options?: UploadOptions): Promise<FileMetadata>;

    /**
     * Download a file from storage
     * @param path The path to the file
     */
    download(path: string): Promise<Buffer>;

    /**
     * Get a readable stream for the file
     * @param path The path to the file
     */
    getStream(path: string): Promise<Readable>;

    /**
     * Delete a file from storage
     * @param path The path to the file
     */
    delete(path: string): Promise<void>;

    /**
     * Check if a file exists
     * @param path The path to the file
     */
    exists(path: string): Promise<boolean>;

    /**
     * Get a public URL for the file
     * @param path The path to the file
     */
    getUrl(path: string): Promise<string>;
}
