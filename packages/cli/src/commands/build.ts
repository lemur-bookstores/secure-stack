import { execa } from 'execa';
import { logger } from '../utils/logger.js';
import { FileManager } from '../utils/files.js';

export async function build(options: { minify?: boolean }) {
    logger.info('Building for production...');

    try {
        const pkg = await FileManager.readJson('package.json');

        if (pkg?.scripts?.build) {
            logger.info('Running "npm run build"...');
            await execa('npm', ['run', 'build'], { stdio: 'inherit' });
            logger.success('Build complete!');
            return;
        }

        // Fallback if no build script
        logger.info('No build script found. Attempting default build with tsup...');

        const args = ['tsup'];
        if (options.minify) {
            args.push('--minify');
        }

        await execa('npx', args, { stdio: 'inherit' });
        logger.success('Build complete!');
    } catch (error) {
        logger.error('Build failed');
        // logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
