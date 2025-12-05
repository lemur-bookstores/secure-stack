import { Prompts } from '../utils/prompts.js';
import { FileManager } from '../utils/files.js';
import { PackageManager } from '../utils/package-manager.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs-extra';

export async function init() {
    try {
        logger.box('Initializing SecureStack', 'SecureStack CLI');

        const cwd = process.cwd();
        const packageJsonPath = path.join(cwd, 'package.json');

        if (!FileManager.exists(packageJsonPath)) {
            logger.error('No package.json found. Please run this command in the root of your project.');
            process.exit(1);
        }

        // Gather information
        const features = await Prompts.features();
        const database = await Prompts.database();

        logger.newLine();
        logger.startSpinner('Installing dependencies...');

        // Core dependencies
        const dependencies = [
            '@lemur-bookstores/core',
            '@lemur-bookstores/server',
            'tsx', // Dev dep usually, but needed for running
        ];

        // Feature dependencies
        if (features.includes('auth')) dependencies.push('@lemur-bookstores/auth');
        if (features.includes('rbac')) dependencies.push('@lemur-bookstores/rbac');
        if (features.includes('mesh')) dependencies.push('@lemur-bookstores/mesh');
        if (features.includes('rate-limit')) dependencies.push('@lemur-bookstores/rate-limit');
        if (features.includes('audit')) dependencies.push('@lemur-bookstores/audit');

        // Database dependencies
        if (database === 'prisma') {
            dependencies.push('@prisma/client');
            dependencies.push('prisma'); // Dev dep
        } else if (database === 'drizzle') {
            dependencies.push('drizzle-orm');
            dependencies.push('drizzle-kit'); // Dev dep
        }

        // Install dependencies
        const pm = await PackageManager.detectPackageManager();
        const installCmd = pm === 'npm' ? 'install' : 'add';

        const { execa } = await import('execa');
        await execa(pm, [installCmd, ...dependencies], { stdio: 'inherit' });

        logger.succeedSpinner('Dependencies installed');

        // Setup TypeScript if needed
        const tsConfigPath = path.join(cwd, 'tsconfig.json');
        if (!FileManager.exists(tsConfigPath)) {
            logger.startSpinner('Creating tsconfig.json...');
            const tsconfig = {
                compilerOptions: {
                    target: 'ES2022',
                    module: 'ESNext',
                    moduleResolution: 'bundler',
                    lib: ['ES2022'],
                    outDir: './dist',
                    rootDir: './src',
                    strict: true,
                    esModuleInterop: true,
                    skipLibCheck: true,
                    forceConsistentCasingInFileNames: true,
                    resolveJsonModule: true,
                    types: ['node'],
                },
                include: ['src/**/*.ts'],
                exclude: ['node_modules', 'dist'],
            };
            await fs.writeJson(tsConfigPath, tsconfig, { spaces: 2 });
            logger.succeedSpinner('tsconfig.json created');
        }

        // Create src directory if it doesn't exist
        const srcDir = path.join(cwd, 'src');
        if (!FileManager.exists(srcDir)) {
            await fs.ensureDir(srcDir);

            // Create a basic index.ts if it doesn't exist
            const indexTsPath = path.join(srcDir, 'index.ts');
            if (!FileManager.exists(indexTsPath)) {
                const indexContent = `import { SecureStack } from '@lemur-bookstores/core';

const app = new SecureStack({
  name: 'my-app',
  port: 3000,
});

app.listen().then(() => {
  console.log('Server running on http://localhost:3000');
});
`;
                await fs.writeFile(indexTsPath, indexContent);
                logger.info('Created src/index.ts');
            }
        }

        logger.newLine();
        logger.success('SecureStack initialized successfully!');

    } catch (error) {
        logger.failSpinner();
        logger.error(`Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
}
