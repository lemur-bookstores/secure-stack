import { describe, it, expect, vi } from 'vitest';
import { ImageProcessor } from '../src/processing/image-processor.js';
import sharp from 'sharp';

vi.mock('sharp', () => {
    const mockChain = {
        resize: vi.fn().mockReturnThis(),
        rotate: vi.fn().mockReturnThis(),
        grayscale: vi.fn().mockReturnThis(),
        toFormat: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed')),
        metadata: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
    };
    return {
        default: vi.fn(() => mockChain),
    };
});

describe('ImageProcessor', () => {
    const processor = new ImageProcessor();
    const input = Buffer.from('test');

    it('should process image with resize', async () => {
        await processor.process(input, { resize: { width: 100, height: 100 } });
        expect(sharp).toHaveBeenCalled();
        expect(sharp().resize).toHaveBeenCalledWith(expect.objectContaining({ width: 100, height: 100 }));
    });

    it('should process image with rotation and grayscale', async () => {
        await processor.process(input, { rotate: 90, grayscale: true });
        expect(sharp().rotate).toHaveBeenCalledWith(90);
        expect(sharp().grayscale).toHaveBeenCalled();
    });

    it('should change format', async () => {
        await processor.process(input, { format: 'png', quality: 80 });
        expect(sharp().toFormat).toHaveBeenCalledWith('png', { quality: 80 });
    });

    it('should get metadata', async () => {
        const metadata = await processor.getMetadata(input);
        expect(metadata).toEqual({ width: 100, height: 100 });
    });
});
