import { Command } from 'commander';
import { logger } from './utils/logger.js';
import { createProject } from './commands/create.js';
import { generateService, generateModule, generateRouter, generateMiddleware } from './commands/generate.js';

const program = new Command();

export async function run() {
    program
        .name('securestack')
        .description('CLI tool for SecureStack - Build secure, type-safe applications')
        .version('0.0.1');

    // Create command
    program
        .command('create <project-name>')
        .description('Create a new SecureStack project')
        .option('-t, --template <template>', 'Project template (monolith, microservices, hybrid)', 'monolith')
        .option('--skip-install', 'Skip npm install')
        .option('--skip-prompts', 'Skip interactive prompts')
        .action(createProject);

    // Init command
    program
        .command('init')
        .description('Initialize SecureStack in an existing project')
        .action(async () => {
            logger.info('Initializing SecureStack...');
            logger.warn('Command not yet implemented - Coming soon!');
        });

    // Generate commands
    const generate = program
        .command('generate')
        .alias('g')
        .description('Generate code (service, module, router, middleware)');

    generate
        .command('service <name>')
        .description('Generate a new service')
        .action(generateService);

    generate
        .command('module <name>')
        .description('Generate a new module')
        .action(generateModule);

    generate
        .command('router <name>')
        .description('Generate a new router')
        .action(generateRouter);

    generate
        .command('middleware <name>')
        .description('Generate a new middleware')
        .action(generateMiddleware);

    // Dev command
    program
        .command('dev')
        .description('Start development server with hot reload')
        .option('-p, --port <port>', 'Port number', '3000')
        .action(async (options) => {
            logger.info(`Starting dev server on port ${options.port}...`);
            logger.warn('Command not yet implemented - Coming soon!');
        });

    // Build command
    program
        .command('build')
        .description('Build for production')
        .option('--minify', 'Minify output')
        .action(async () => {
            logger.info('Building for production...');
            logger.warn('Command not yet implemented - Coming soon!');
        });

    // Mesh commands
    const mesh = program
        .command('mesh')
        .description('Service mesh management tools');

    mesh
        .command('visualize')
        .description('Visualize mesh topology')
        .action(async () => {
            logger.info('Visualizing mesh topology...');
            logger.warn('Command not yet implemented - Coming soon!');
        });

    mesh
        .command('status')
        .description('Show service status')
        .action(async () => {
            logger.info('Checking service status...');
            logger.warn('Command not yet implemented - Coming soon!');
        });

    mesh
        .command('rotate-keys')
        .description('Manually rotate encryption keys')
        .action(async () => {
            logger.info('Rotating encryption keys...');
            logger.warn('Command not yet implemented - Coming soon!');
        });

    mesh
        .command('health')
        .description('Health check all services')
        .action(async () => {
            logger.info('Running health checks...');
            logger.warn('Command not yet implemented - Coming soon!');
        });

    // Typecheck command
    program
        .command('typecheck')
        .description('Run TypeScript type checking')
        .action(async () => {
            logger.info('Running type check...');
            logger.warn('Command not yet implemented - Coming soon!');
        });

    // Deploy command
    program
        .command('deploy')
        .description('Deploy helpers')
        .action(async () => {
            logger.info('Deploying...');
            logger.warn('Command not yet implemented - Coming soon!');
        });

    // Docker command
    program
        .command('docker')
        .description('Generate Docker files')
        .action(async () => {
            logger.info('Generating Docker files...');
            logger.warn('Command not yet implemented - Coming soon!');
        });

    try {
        await program.parseAsync(process.argv);
    } catch (error) {
        logger.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
}
