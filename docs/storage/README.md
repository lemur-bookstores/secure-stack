# @lemur-bookstores/storage

A unified storage module for SecureStack with support for local and cloud storage providers.

## Features

- 🔌 **Driver-based architecture**: Easily switch between storage strategies.
- 📂 **Local Provider**: Stores files on the local file system (ideal for development).
- ☁️ **S3 Provider**: Stores files on AWS S3 or compatible services (MinIO, etc.).
- 🛡️ **Unified API**: Consistent interface for upload, download, delete, and existence checks.
- 🔗 **Signed URLs**: Generate public/private URLs for files.
- 🖼️ **Image Processing**: Resize, crop, and convert images using `sharp`.
- ✅ **Validation**: File size and mime-type validation.
- 🔄 **Middleware**: Multipart upload middleware with validation pipeline.

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

### Advanced Usage (Validation & Processing)

```typescript
import { StorageManager } from '@lemur-bookstores/storage';

const storage = new StorageManager({ default: 'local' });

await storage.upload(fileBuffer, 'images/profile.jpg', {
  mimetype: 'image/jpeg',
  validation: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png'],
    custom: async (file, metadata) => {
      // Example: Check for specific filename pattern
      if (metadata.originalName?.includes('test')) {
        return 'Test files are not allowed';
      }
      return true;
    },
  },
  process: {
    resize: { width: 800, height: 600, fit: 'cover' },
    format: 'webp',
    quality: 80,
  },
});
```

### Middleware Usage (Node.js/Fastify/Express)

```typescript
import { StorageMiddleware, StorageManager } from '@lemur-bookstores/storage';
import http from 'http';

const storage = new StorageManager();
const uploadMiddleware = new StorageMiddleware({
  storageManager: storage,
  path: (file) => `uploads/${Date.now()}-${file.filename}`,
  validation: { maxSize: 10 * 1024 * 1024 },
});

http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.headers['content-type']?.includes('multipart/form-data')) {
    try {
      const files = await uploadMiddleware.handle(req);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(files));
    } catch (err) {
      res.writeHead(400);
      res.end(err.message);
    }
  }
}).listen(3000);
```

## API

### `StorageManager`

- `upload(file: Buffer | Readable, path: string, options?: ExtendedUploadOptions): Promise<FileMetadata>`
- `download(path: string): Promise<Buffer>`
- `getStream(path: string): Promise<Readable>`
- `delete(path: string): Promise<void>`
- `exists(path: string): Promise<boolean>`
- `getUrl(path: string): Promise<string>`
- `getProvider(name?: string): StorageProvider`

### `ExtendedUploadOptions`

- `validation`: `ValidationOptions` (maxSize, allowedMimeTypes, custom)
- `process`: `ImageProcessOptions` (resize, format, quality, rotate, grayscale)

## License

MIT
