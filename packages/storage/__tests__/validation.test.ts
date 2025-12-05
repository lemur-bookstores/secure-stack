import { describe, it, expect } from 'vitest';
import { FileValidator } from '../src/validation/file-validator.js';

describe('FileValidator', () => {
    const file = Buffer.from('test');

    it('should validate size', async () => {
        await expect(FileValidator.validate(file, { size: 100 }, { maxSize: 50 })).rejects.toThrow('File size exceeds limit');
        await expect(FileValidator.validate(file, { size: 40 }, { maxSize: 50 })).resolves.not.toThrow();
    });

    it('should validate mime type', async () => {
        await expect(FileValidator.validate(file, { mimetype: 'image/png' }, { allowedMimeTypes: ['image/jpeg'] })).rejects.toThrow('File type image/png is not allowed');
        await expect(FileValidator.validate(file, { mimetype: 'image/jpeg' }, { allowedMimeTypes: ['image/jpeg'] })).resolves.not.toThrow();
    });

    it('should run custom validation', async () => {
        const custom = async () => false;
        await expect(FileValidator.validate(file, {}, { custom })).rejects.toThrow('File validation failed');

        const customError = async () => 'Custom error';
        await expect(FileValidator.validate(file, {}, { custom: customError })).rejects.toThrow('Custom error');

        const customSuccess = async () => true;
        await expect(FileValidator.validate(file, {}, { custom: customSuccess })).resolves.not.toThrow();
    });
});
