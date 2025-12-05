import { describe, it, expect, vi, afterEach } from 'vitest';
import { docker, deploy } from '../deploy';
import { FileManager } from '../../utils/files';
import fs from 'fs-extra';

// Mock logger
vi.mock('../../utils/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        success: vi.fn(),
    }
}));

// Mock fs-extra
vi.mock('fs-extra', () => ({
    default: {
        pathExists: vi.fn(),
        writeFile: vi.fn(),
    }
}));

// Mock FileManager
vi.mock('../../utils/files', () => ({
    FileManager: {
        readJson: vi.fn(),
    }
}));

// Mock execa
vi.mock('execa', () => ({
    execa: vi.fn(),
}));

describe('Deploy Commands', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('docker', () => {
        it('should generate Dockerfile and docker-compose.yml if they do not exist', async () => {
            // Setup mocks
            (fs.pathExists as any).mockResolvedValue(false);

            await docker();

            // Verify Dockerfile creation
            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('Dockerfile'),
                expect.stringContaining('FROM node:18-alpine')
            );

            // Verify docker-compose creation
            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('docker-compose.yml'),
                expect.stringContaining('version: \'3.8\'')
            );
        });

        it('should skip generation if files exist', async () => {
            (fs.pathExists as any).mockResolvedValue(true);

            await docker();

            expect(fs.writeFile).not.toHaveBeenCalled();
        });
    });

    describe('deploy', () => {
        it('should run npm run deploy if script exists', async () => {
            (FileManager.readJson as any).mockResolvedValue({
                scripts: { deploy: 'echo deploy' }
            });

            await deploy();

            // We need to import execa to check if it was called
            const { execa } = await import('execa');
            expect(execa).toHaveBeenCalledWith('npm', ['run', 'deploy'], { stdio: 'inherit' });
        });

        it('should warn if no deploy script exists', async () => {
            (FileManager.readJson as any).mockResolvedValue({
                scripts: {}
            });

            await deploy();

            const { execa } = await import('execa');
            expect(execa).not.toHaveBeenCalled();
        });
    });
});
