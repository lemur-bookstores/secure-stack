# @lemur-bookstores/storage

A unified storage module for SecureStack with support for local and cloud storage providers.

## Features

- 🔌 **Driver-based architecture**: Easily switch between storage strategies.
- 📂 **Local Provider**: Stores files on the local file system (ideal for development).
- ☁️ **S3 Provider**: Stores files on AWS S3 or compatible services (MinIO, etc.).
- 🛡️ **Unified API**: Consistent interface for upload, download, delete, and existence checks.
- 🔗 **Signed URLs**: Generate public/private URLs for files.

## Installation

```bash
npm install @lemur-bookstores/storage
```

## Usage

### Basic Usage (Local)

```typescript
import { StorageManager } from '@lemur-bookstores/storage';

const storage = new StorageManager({
  default: 'local',
  local: {
    root: './uploads',
    baseUrl: 'http://localhost:3000/uploads/',
  },
});

// Upload a file
await storage.upload(fileBuffer, 'images/profile.jpg', { mimetype: 'image/jpeg' });

// Get a URL
const url = await storage.getUrl('images/profile.jpg');
```

### S3 Usage

```typescript
import { StorageManager } from '@lemur-bookstores/storage';

const storage = new StorageManager({
  default: 's3',
  s3: {
    region: 'us-east-1',
    bucket: 'my-app-bucket',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
```

## API

### `StorageManager`

- `upload(file: Buffer | Readable, path: string, options?: UploadOptions): Promise<FileMetadata>`
- `download(path: string): Promise<Buffer>`
- `getStream(path: string): Promise<Readable>`
- `delete(path: string): Promise<void>`
- `exists(path: string): Promise<boolean>`
- `getUrl(path: string): Promise<string>`
- `getProvider(name?: string): StorageProvider`

## License

MIT
