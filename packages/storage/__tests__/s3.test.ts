import { describe, it, expect, vi, beforeEach } from 'vitest';
import { S3Provider } from '../src/providers/s3.js';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

vi.mock('@aws-sdk/client-s3');
vi.mock('@aws-sdk/s3-request-presigner');

describe('S3Provider', () => {
    let provider: S3Provider;
    let mockClient: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockClient = {
            send: vi.fn(),
        };
        (S3Client as any).mockImplementation(() => mockClient);
        provider = new S3Provider({
            region: 'us-east-1',
            bucket: 'test-bucket',
            accessKeyId: 'test',
            secretAccessKey: 'test',
        });
    });

    it('should initialize correctly', () => {
        expect(S3Client).toHaveBeenCalledWith(expect.objectContaining({
            region: 'us-east-1',
            credentials: {
                accessKeyId: 'test',
                secretAccessKey: 'test',
            },
        }));
    });

    it('should upload a file', async () => {
        const file = Buffer.from('test');
        const path = 'test.txt';

        mockClient.send.mockResolvedValueOnce({}); // PutObject
        mockClient.send.mockResolvedValueOnce({ // HeadObject
            ContentLength: 4,
            ContentType: 'text/plain',
            LastModified: new Date(),
        });
        (getSignedUrl as any).mockResolvedValue('https://s3.amazonaws.com/test-bucket/test.txt');

        const result = await provider.upload(file, path, { mimetype: 'text/plain' });

        expect(mockClient.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
        expect(mockClient.send).toHaveBeenCalledWith(expect.any(HeadObjectCommand));
        expect(result.path).toBe(path);
        expect(result.size).toBe(4);
    });

    it('should download a file', async () => {
        const path = 'test.txt';
        const content = Buffer.from('test');

        mockClient.send.mockResolvedValue({
            Body: {
                transformToByteArray: vi.fn().mockResolvedValue(content),
            },
        });

        const result = await provider.download(path);

        expect(mockClient.send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
        expect(result).toEqual(content);
    });

    it('should delete a file', async () => {
        const path = 'test.txt';
        mockClient.send.mockResolvedValue({});

        await provider.delete(path);

        expect(mockClient.send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
    });

    it('should check if file exists', async () => {
        const path = 'test.txt';
        mockClient.send.mockResolvedValue({});

        expect(await provider.exists(path)).toBe(true);
        expect(mockClient.send).toHaveBeenCalledWith(expect.any(HeadObjectCommand));
    });

    it('should return false if file does not exist', async () => {
        const path = 'test.txt';
        mockClient.send.mockRejectedValue(new Error('NotFound'));

        expect(await provider.exists(path)).toBe(false);
    });

    it('should get signed url', async () => {
        const path = 'test.txt';
        const url = 'https://s3.amazonaws.com/test-bucket/test.txt';
        (getSignedUrl as any).mockResolvedValue(url);

        expect(await provider.getUrl(path)).toBe(url);
    });
});
