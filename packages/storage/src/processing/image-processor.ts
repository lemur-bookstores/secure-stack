import sharp from 'sharp';
import { Readable } from 'stream';

export interface ResizeOptions {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    position?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'center';
}

export interface ImageProcessOptions {
    resize?: ResizeOptions;
    format?: 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff';
    quality?: number; // 1-100
    rotate?: number;
    grayscale?: boolean;
}

export class ImageProcessor {
    /**
     * Process an image buffer or stream
     */
    async process(input: Buffer | Readable, options: ImageProcessOptions): Promise<Buffer> {
        let pipeline = sharp(await this.toBuffer(input));

        if (options.resize) {
            pipeline = pipeline.resize({
                width: options.resize.width,
                height: options.resize.height,
                fit: options.resize.fit,
                position: options.resize.position,
            });
        }

        if (options.rotate) {
            pipeline = pipeline.rotate(options.rotate);
        }

        if (options.grayscale) {
            pipeline = pipeline.grayscale();
        }

        if (options.format) {
            pipeline = pipeline.toFormat(options.format, { quality: options.quality });
        }

        return pipeline.toBuffer();
    }

    /**
     * Get image metadata
     */
    async getMetadata(input: Buffer | Readable) {
        const buffer = await this.toBuffer(input);
        return sharp(buffer).metadata();
    }

    private async toBuffer(input: Buffer | Readable): Promise<Buffer> {
        if (Buffer.isBuffer(input)) {
            return input;
        }

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            input.on('data', (chunk) => chunks.push(chunk));
            input.on('end', () => resolve(Buffer.concat(chunks as Uint8Array[])));
            input.on('error', reject);
        });
    }
}
