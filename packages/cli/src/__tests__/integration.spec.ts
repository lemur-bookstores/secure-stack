import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProject } from '../commands/create';
import { generateService, generateRouter } from '../commands/generate';
import { FileManager } from '../utils/files';

// Mock dependencies
vi.mock('../utils/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        success: vi.fn(),
        box: vi.fn(),
        newLine: vi.fn(),
        startSpinner: vi.fn(),
        succeedSpinner: vi.fn(),
        failSpinner: vi.fn(),
        log: vi.fn(),
    }
}));

vi.mock('../utils/files', () => ({
    FileManager: {
        exists: vi.fn(),
        createDir: vi.fn(),
        writeFile: vi.fn(),
        readJson: vi.fn(),
        copy: vi.fn(),
    }
}));

vi.mock('../utils/package-manager', () => ({
    PackageManager: {
        install: vi.fn(),
    }
}));

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }) as any);

describe('CLI Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createProject', () => {
        it('should scaffold a new project with defaults', async () => {
            // Setup mocks
            (FileManager.exists as any).mockReturnValue(false);

            await createProject('test-app', {
                template: 'monolith',
                skipPrompts: true,
                skipInstall: true
            });

            // Verify directory creation
            expect(FileManager.createDir).toHaveBeenCalled();

            // Verify file creation (package.json, tsconfig, etc)
            expect(FileManager.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('package.json'),
                expect.stringContaining('test-app')
            );
        });

        it('should fail if directory exists', async () => {
            (FileManager.exists as any).mockReturnValue(true);

            await createProject('existing-app', { skipPrompts: true });

            expect(mockExit).toHaveBeenCalledWith(1);
        });
    });

    describe('generate', () => {
        it('should generate a service structure', async () => {
            // Mock being in a project root
            (FileManager.exists as any).mockImplementation((p: string) => {
                if (p.endsWith('package.json')) return true;
                return false;
            });

            await generateService('users');

            expect(FileManager.createDir).toHaveBeenCalledWith(expect.stringContaining('users'));
            expect(FileManager.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('service.ts'),
                expect.any(String)
            );
        });

        it('should generate a router', async () => {
            (FileManager.exists as any).mockImplementation((p: string) => {
                if (p.endsWith('package.json')) return true;
                return false;
            });

            await generateRouter('posts');

            expect(FileManager.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('posts.router.ts'),
                expect.stringContaining('@lemur-bookstores/core')
            );
        });
    });
});
