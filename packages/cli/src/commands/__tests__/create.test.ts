import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProject } from '../create.js';
import { Prompts } from '../../utils/prompts.js';
import { FileManager } from '../../utils/files.js';
import { PackageManager } from '../../utils/package-manager.js';
import { logger } from '../../utils/logger.js';
import path from 'path';

vi.mock('../../utils/prompts.js');
vi.mock('../../utils/files.js');
vi.mock('../../utils/package-manager.js');
vi.mock('../../utils/logger.js');

describe('createProject', () => {
    const projectName = 'test-project';
    const projectPath = path.resolve(process.cwd(), projectName);

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(FileManager.exists).mockReturnValue(false);
    });

    it('should create a project with default options', async () => {
        // Mock prompts
        vi.mocked(Prompts.projectType).mockResolvedValue('monolith');
        vi.mocked(Prompts.features).mockResolvedValue(['auth']);
        vi.mocked(Prompts.database).mockResolvedValue('none');

        await createProject(projectName, { skipInstall: true });

        // Verify directory creation
        expect(FileManager.createDir).toHaveBeenCalledWith(projectPath);
        expect(FileManager.createDir).toHaveBeenCalledWith(path.join(projectPath, 'src'));

        // Verify file generation
        expect(FileManager.writeFile).toHaveBeenCalledWith(
            expect.stringContaining('package.json'),
            expect.stringContaining('"name": "test-project"')
        );
        expect(FileManager.writeFile).toHaveBeenCalledWith(
            expect.stringContaining('tsconfig.json'),
            expect.any(String)
        );
        expect(FileManager.writeFile).toHaveBeenCalledWith(
            expect.stringContaining('README.md'),
            expect.any(String)
        );

        // Verify no installation
        expect(PackageManager.install).not.toHaveBeenCalled();
    });

    it('should install dependencies if not skipped', async () => {
        vi.mocked(Prompts.projectType).mockResolvedValue('monolith');
        vi.mocked(Prompts.features).mockResolvedValue([]);
        vi.mocked(Prompts.database).mockResolvedValue('none');

        await createProject(projectName, { skipInstall: false });

        expect(PackageManager.install).toHaveBeenCalledWith(projectPath);
    });

    it('should fail if project directory already exists', async () => {
        vi.mocked(FileManager.exists).mockReturnValue(true);

        // Mock process.exit
        const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit called');
        });

        await expect(createProject(projectName, {})).rejects.toThrow('process.exit called');

        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('already exists'));

        mockExit.mockRestore();
    });
});
