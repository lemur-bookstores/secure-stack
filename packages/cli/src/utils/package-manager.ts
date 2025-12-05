import { execa } from 'execa';
import { logger } from './logger.js';

export class PackageManager {
    /**
     * Install dependencies in a directory
     */
    static async install(cwd: string): Promise<void> {
        try {
            logger.startSpinner('Installing dependencies...');

            await execa('npm', ['install'], {
                cwd,
                stdio: 'pipe',
            });

            logger.succeedSpinner('Dependencies installed successfully');
        } catch (error) {
            logger.failSpinner('Failed to install dependencies');
            throw error;
        }
    }

    /**
     * Detect which package manager is being used
     */
    static async detectPackageManager(): Promise<'npm' | 'yarn' | 'pnpm'> {
        try {
            await execa('pnpm', ['--version']);
            return 'pnpm';
        } catch {
            try {
                await execa('yarn', ['--version']);
                return 'yarn';
            } catch {
                return 'npm';
            }
        }
    }

    /**
     * Run a script in package.json
     */
    static async runScript(cwd: string, script: string): Promise<void> {
        const pm = await this.detectPackageManager();

        await execa(pm, ['run', script], {
            cwd,
            stdio: 'inherit',
        });
    }
}
