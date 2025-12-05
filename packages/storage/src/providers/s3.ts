import { StorageProvider, FileMetadata, UploadOptions } from '../interfaces/storage-provider.js';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

export interface S3Config {
    region: string;
    bucket: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    endpoint?: string; // For MinIO or other S3-compatible services
    forcePathStyle?: boolean;
}

export class S3Provider implements StorageProvider {
    private client: S3Client;
    private bucket: string;

    constructor(config: S3Config) {
        this.bucket = config.bucket;
        this.client = new S3Client({
            region: config.region,
            endpoint: config.endpoint,
            forcePathStyle: config.forcePathStyle,
            credentials: config.accessKeyId && config.secretAccessKey ? {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            } : undefined,
        });
    }

    async upload(file: Buffer | Readable, path: string, options?: UploadOptions): Promise<FileMetadata> {
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: path,
            Body: file,
            ContentType: options?.mimetype,
            Metadata: options?.metadata,
        });

        await this.client.send(command);

        // Get object details to return metadata
        const headCommand = new HeadObjectCommand({
            Bucket: this.bucket,
            Key: path,
        });
        const head = await this.client.send(headCommand);

        return {
            path,
            url: await this.getUrl(path),
            size: head.ContentLength,
            mimetype: head.ContentType,
            lastModified: head.LastModified,
        };
    }

    async download(path: string): Promise<Buffer> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: path,
        });

        const response = await this.client.send(command);

        if (!response.Body) {
            throw new Error(`File not found: ${path}`);
        }

        return Buffer.from(await response.Body.transformToByteArray());
    }

    async getStream(path: string): Promise<Readable> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: path,
        });

        const response = await this.client.send(command);

        if (!response.Body) {
            throw new Error(`File not found: ${path}`);
        }

        return response.Body as Readable;
    }

    async delete(path: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: path,
        });

        await this.client.send(command);
    }

    async exists(path: string): Promise<boolean> {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucket,
                Key: path,
            });
            await this.client.send(command);
            return true;
        } catch (error) {
            return false;
        }
    }

    async getUrl(path: string): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: path,
        });
        return getSignedUrl(this.client, command, { expiresIn: 3600 });
    }
}
