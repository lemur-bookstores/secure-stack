import { Command } from 'commander';
import { logger } from './utils/logger.js';
import { createProject } from './commands/create.js';
import { init } from './commands/init.js';
import { generateService, generateModule, generateRouter, generateMiddleware } from './commands/generate.js';
import { dev } from './commands/dev.js';
import { meshStatus, meshHealth, meshRotateKeys, meshVisualize } from './commands/mesh.js';
import { build } from './commands/build.js';
import { deploy, docker } from './commands/deploy.js';

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
        .action(init);

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
        .action(dev);

    // Build command
    program
        .command('build')
        .description('Build for production')
        .option('--minify', 'Minify output')
        .action(build);

    // Mesh commands
    const mesh = program
        .command('mesh')
        .description('Service mesh management tools');

    mesh
        .command('visualize')
        .description('Visualize mesh topology')
        .action(meshVisualize);

    mesh
        .command('status')
        .description('Show service status')
        .option('-u, --url <url>', 'Service URL', 'http://localhost:3000')
        .action(meshStatus);

    mesh
        .command('rotate-keys')
        .description('Manually rotate encryption keys')
        .option('-u, --url <url>', 'Service URL', 'http://localhost:3000')
        .action(meshRotateKeys);

    mesh
        .command('health')
        .description('Health check all services')
        .option('-u, --url <url>', 'Service URL', 'http://localhost:3000')
        .action(meshHealth);

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
        .action(deploy);

    // Docker command
    program
        .command('docker')
        .description('Generate Docker files')
        .action(docker);

    try {
        await program.parseAsync(process.argv);
    } catch (error) {
        logger.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
}
