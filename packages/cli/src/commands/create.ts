import { Prompts, ProjectOptions, DatabaseType } from '../utils/prompts.js';
import { Validation } from '../utils/validation.js';
import { FileManager } from '../utils/files.js';
import { PackageManager } from '../utils/package-manager.js';
import { logger } from '../utils/logger.js';
import picocolors from 'picocolors';
import path from 'path';

export async function createProject(projectName: string, options: any) {
    try {
        logger.box(
            `Creating new SecureStack project: ${picocolors.cyan(projectName)}`,
            'SecureStack CLI'
        );

        // Validate project name
        const validation = Validation.projectName(projectName);
        if (!validation.valid) {
            logger.error(validation.error || 'Invalid project name');
            process.exit(1);
        }

        // Check if directory already exists
        const projectPath = path.resolve(process.cwd(), projectName);
        if (FileManager.exists(projectPath)) {
            logger.error(`Directory ${projectName} already exists`);
            process.exit(1);
        }

        // Interactive setup if no template specified
        let projectType = options.template;
        let features: string[] = [];
        let database: DatabaseType = 'none';

        if (!options.skipPrompts) {
            logger.newLine();
            projectType = await Prompts.projectType();
            features = await Prompts.features();
            database = await Prompts.database();
        }

        const projectOptions: ProjectOptions = {
            name: projectName,
            type: projectType,
            features,
            database,
            installDeps: !options.skipInstall,
        };

        logger.newLine();
        logger.startSpinner('Creating project structure...');

        // Create project directory
        await FileManager.createDir(projectPath);

        // Create basic structure
        await createProjectStructure(projectPath, projectOptions);

        logger.succeedSpinner('Project structure created');

        // Generate package.json
        logger.startSpinner('Generating package.json...');
        await generatePackageJson(projectPath, projectOptions);
        logger.succeedSpinner('package.json generated');

        // Generate tsconfig.json
        logger.startSpinner('Generating tsconfig.json...');
        await generateTsConfig(projectPath);
        logger.succeedSpinner('tsconfig.json generated');

        // Generate source files
        logger.startSpinner('Generating source files...');
        await generateSourceFiles(projectPath, projectOptions);
        logger.succeedSpinner('Source files generated');

        // Install dependencies
        if (projectOptions.installDeps) {
            await PackageManager.install(projectPath);
        }

        logger.newLine();
        logger.success('Project created successfully!');
        logger.newLine();

        logger.box(
            `Next steps:\n  cd ${projectName}\n  npm run dev`,
            '🎉 Success!'
        );

    } catch (error) {
        logger.failSpinner();
        logger.error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
}

async function createProjectStructure(projectPath: string, options: ProjectOptions) {
    // Create directories
    await FileManager.createDir(path.join(projectPath, 'src'));
    await FileManager.createDir(path.join(projectPath, 'src', 'routes'));

    if (options.type === 'microservices') {
        await FileManager.createDir(path.join(projectPath, 'services'));
    }
}

async function generatePackageJson(projectPath: string, options: ProjectOptions) {
    const packageJson = {
        name: options.name,
        version: '0.0.1',
        description: `SecureStack ${options.type} application`,
        type: 'module',
        scripts: {
            dev: 'tsx watch src/index.ts',
            build: 'tsup',
            start: 'node dist/index.js',
            typecheck: 'tsc --noEmit',
        },
        dependencies: {
            '@lemur-bookstores/core': '*',
            '@lemur-bookstores/server': '*',
        } as Record<string, string>,
        devDependencies: {
            'tsx': '^4.7.0',
            'tsup': '^8.0.0',
            'typescript': '^5.3.3',
            '@types/node': '^20.11.5',
        } as Record<string, string>,
    };

    // Add feature dependencies
    if (options.features.includes('auth')) {
        packageJson.dependencies['@lemur-bookstores/auth'] = '*';
    }
    if (options.features.includes('rbac')) {
        packageJson.dependencies['@lemur-bookstores/rbac'] = '*';
    }
    if (options.features.includes('mesh')) {
        packageJson.dependencies['@lemur-bookstores/mesh'] = '*';
    }
    if (options.features.includes('rate-limit')) {
        packageJson.dependencies['@lemur-bookstores/rate-limit'] = '*';
    }
    if (options.features.includes('audit')) {
        packageJson.dependencies['@lemur-bookstores/audit'] = '*';
    }

    // Add database dependencies
    if (options.database === 'prisma') {
        packageJson.dependencies['@prisma/client'] = '^5.0.0';
        packageJson.devDependencies['prisma'] = '^5.0.0';
    } else if (options.database === 'drizzle') {
        packageJson.dependencies['drizzle-orm'] = '^0.29.0';
        packageJson.devDependencies['drizzle-kit'] = '^0.20.0';
    }

    await FileManager.writeFile(
        path.join(projectPath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    );
}

async function generateTsConfig(projectPath: string) {
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

    await FileManager.writeFile(
        path.join(projectPath, 'tsconfig.json'),
        JSON.stringify(tsconfig, null, 2)
    );
}

async function generateSourceFiles(projectPath: string, options: ProjectOptions) {
    // Generate index.ts
    const indexContent = `import { SecureStack } from '@lemur-bookstores/core';

const app = new SecureStack({
  name: '${options.name}',
  port: 3000,
});

// TODO: Add your routes here

app.listen().then(() => {
  console.log('Server running on http://localhost:3000');
});
`;

    await FileManager.writeFile(
        path.join(projectPath, 'src', 'index.ts'),
        indexContent
    );

    // Generate README.md
    const readmeContent = `# ${options.name}

SecureStack ${options.type} application

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features

${options.features.map(f => `- ${f}`).join('\n')}

## Database

${options.database !== 'none' ? `Using ${options.database}` : 'No database configured'}
`;

    await FileManager.writeFile(
        path.join(projectPath, 'README.md'),
        readmeContent
    );
}
