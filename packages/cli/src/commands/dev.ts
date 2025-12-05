import { execa } from 'execa';
import chokidar from 'chokidar';
import { logger } from '../utils/logger.js';
import { FileManager } from '../utils/files.js';
import path from 'path';
import picocolors from 'picocolors';

interface DevOptions {
    port?: string;
}

let devProcess: any = null;

export async function dev(options: DevOptions) {
    try {
        // Check if we're in a SecureStack project
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        if (!FileManager.exists(packageJsonPath)) {
            logger.error('Not a SecureStack project. Run this command in a project directory.');
            process.exit(1);
        }

        const port = options.port || '3000';

        logger.box(
            `Starting development server on port ${picocolors.cyan(port)}`,
            'SecureStack Dev Server'
        );
        logger.newLine();

        // Start the dev server
        await startDevServer(port);

        // Watch for file changes
        const watcher = chokidar.watch(['src/**/*.ts', 'src/**/*.js'], {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true,
            ignoreInitial: true,
        });

        logger.info('👀 Watching for file changes...');
        logger.newLine();

        watcher.on('change', async (filePath) => {
            logger.info(`📝 File changed: ${picocolors.dim(filePath)}`);
            logger.info('🔄 Restarting server...');
            logger.newLine();

            await restartDevServer(port);
        });

        watcher.on('add', async (filePath) => {
            logger.info(`➕ File added: ${picocolors.dim(filePath)}`);
            logger.info('🔄 Restarting server...');
            logger.newLine();

            await restartDevServer(port);
        });

        watcher.on('unlink', async (filePath) => {
            logger.info(`➖ File removed: ${picocolors.dim(filePath)}`);
            logger.info('🔄 Restarting server...');
            logger.newLine();

            await restartDevServer(port);
        });

        // Handle process termination
        process.on('SIGINT', async () => {
            logger.newLine();
            logger.info('Shutting down dev server...');
            await stopDevServer();
            await watcher.close();
            process.exit(0);
        });

    } catch (error) {
        logger.error(`Failed to start dev server: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
}

async function startDevServer(port: string): Promise<void> {
    try {
        devProcess = execa('npx', ['tsx', 'watch', 'src/index.ts'], {
            env: { ...process.env, PORT: port },
            stdio: 'inherit',
        });

        logger.success('✨ Dev server started successfully');
        logger.info(`🚀 Server running at ${picocolors.cyan(`http://localhost:${port}`)}`);
        logger.newLine();

    } catch (error) {
        logger.error('Failed to start dev server');
        throw error;
    }
}

async function restartDevServer(port: string): Promise<void> {
    await stopDevServer();
    await startDevServer(port);
}

async function stopDevServer(): Promise<void> {
    if (devProcess) {
        devProcess.kill('SIGTERM', { forceKillAfterTimeout: 2000 });
        devProcess = null;
    }
}
