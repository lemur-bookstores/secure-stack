import { Validation } from '../utils/validation.js';
import { FileManager } from '../utils/files.js';
import { logger } from '../utils/logger.js';
import path from 'path';

export async function generateService(name: string) {
    try {
        // Validate name
        const validation = Validation.componentName(name);
        if (!validation.valid) {
            logger.error(validation.error || 'Invalid service name');
            process.exit(1);
        }

        logger.startSpinner(`Generating service: ${name}...`);

        const servicePath = path.join(process.cwd(), 'src', 'services', name);

        // Check if service already exists
        if (FileManager.exists(servicePath)) {
            logger.failSpinner();
            logger.error(`Service ${name} already exists`);
            process.exit(1);
        }

        // Create service directory
        await FileManager.createDir(servicePath);

        // Generate service file
        const serviceContent = `export class ${capitalize(name)}Service {
  constructor() {
    // Initialize service
  }

  async findAll() {
    // TODO: Implement findAll
    return [];
  }

  async findById(id: string) {
    // TODO: Implement findById
    return null;
  }

  async create(data: any) {
    // TODO: Implement create
    return data;
  }

  async update(id: string, data: any) {
    // TODO: Implement update
    return data;
  }

  async delete(id: string) {
    // TODO: Implement delete
    return true;
  }
}
`;

        await FileManager.writeFile(
            path.join(servicePath, `${name}.service.ts`),
            serviceContent
        );

        // Generate router file
        const routerContent = `import { router } from '@lemur-bookstores/secure-stack-core';
import { ${capitalize(name)}Service } from './${name}.service.js';

const ${name}Service = new ${capitalize(name)}Service();

export const ${name}Router = router()
  .query('findAll', async () => {
    return await ${name}Service.findAll();
  })
  .query('findById', async ({ input }: { input: { id: string } }) => {
    return await ${name}Service.findById(input.id);
  })
  .mutation('create', async ({ input }: { input: any }) => {
    return await ${name}Service.create(input);
  })
  .mutation('update', async ({ input }: { input: { id: string; data: any } }) => {
    return await ${name}Service.update(input.id, input.data);
  })
  .mutation('delete', async ({ input }: { input: { id: string } }) => {
    return await ${name}Service.delete(input.id);
  });
`;

        await FileManager.writeFile(
            path.join(servicePath, `${name}.router.ts`),
            routerContent
        );

        // Generate index file
        const indexContent = `export * from './${name}.service.js';
export * from './${name}.router.js';
`;

        await FileManager.writeFile(
            path.join(servicePath, 'index.ts'),
            indexContent
        );

        logger.succeedSpinner(`Service ${name} generated successfully`);
        logger.newLine();
        logger.info('Generated files:');
        logger.log(`  src/services/${name}/${name}.service.ts`);
        logger.log(`  src/services/${name}/${name}.router.ts`);
        logger.log(`  src/services/${name}/index.ts`);

    } catch (error) {
        logger.failSpinner();
        logger.error(`Failed to generate service: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
}

export async function generateModule(name: string) {
    try {
        const validation = Validation.componentName(name);
        if (!validation.valid) {
            logger.error(validation.error || 'Invalid module name');
            process.exit(1);
        }

        logger.startSpinner(`Generating module: ${name}...`);

        const modulePath = path.join(process.cwd(), 'src', 'modules', name);

        if (FileManager.exists(modulePath)) {
            logger.failSpinner();
            logger.error(`Module ${name} already exists`);
            process.exit(1);
        }

        await FileManager.createDir(modulePath);

        const moduleContent = `import { router } from '@lemur-bookstores/secure-stack-core';

export const ${name}Module = router()
  .query('example', async () => {
    return { message: 'Hello from ${name} module' };
  });
`;

        await FileManager.writeFile(
            path.join(modulePath, 'index.ts'),
            moduleContent
        );

        logger.succeedSpinner(`Module ${name} generated successfully`);
        logger.newLine();
        logger.info('Generated files:');
        logger.log(`  src/modules/${name}/index.ts`);

    } catch (error) {
        logger.failSpinner();
        logger.error(`Failed to generate module: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
}

export async function generateRouter(name: string) {
    try {
        const validation = Validation.componentName(name);
        if (!validation.valid) {
            logger.error(validation.error || 'Invalid router name');
            process.exit(1);
        }

        logger.startSpinner(`Generating router: ${name}...`);

        const routerPath = path.join(process.cwd(), 'src', 'routes', `${name}.router.ts`);

        if (FileManager.exists(routerPath)) {
            logger.failSpinner();
            logger.error(`Router ${name} already exists`);
            process.exit(1);
        }

        const routerContent = `import { router } from '@lemur-bookstores/secure-stack-core';

export const ${name}Router = router()
  .query('list', async () => {
    // TODO: Implement list query
    return [];
  })
  .query('get', async ({ input }: { input: { id: string } }) => {
    // TODO: Implement get query
    return { id: input.id };
  })
  .mutation('create', async ({ input }: { input: any }) => {
    // TODO: Implement create mutation
    return input;
  })
  .mutation('update', async ({ input }: { input: { id: string; data: any } }) => {
    // TODO: Implement update mutation
    return { id: input.id, ...input.data };
  })
  .mutation('delete', async ({ input }: { input: { id: string } }) => {
    // TODO: Implement delete mutation
    return { success: true };
  });
`;

        await FileManager.writeFile(routerPath, routerContent);

        logger.succeedSpinner(`Router ${name} generated successfully`);
        logger.newLine();
        logger.info('Generated files:');
        logger.log(`  src/routes/${name}.router.ts`);

    } catch (error) {
        logger.failSpinner();
        logger.error(`Failed to generate router: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
}

export async function generateMiddleware(name: string) {
    try {
        const validation = Validation.componentName(name);
        if (!validation.valid) {
            logger.error(validation.error || 'Invalid middleware name');
            process.exit(1);
        }

        logger.startSpinner(`Generating middleware: ${name}...`);

        const middlewarePath = path.join(process.cwd(), 'src', 'middleware', `${name}.middleware.ts`);

        if (FileManager.exists(middlewarePath)) {
            logger.failSpinner();
            logger.error(`Middleware ${name} already exists`);
            process.exit(1);
        }

        await FileManager.createDir(path.dirname(middlewarePath));

        const middlewareContent = `import { middleware } from '@lemur-bookstores/secure-stack-core';

export const ${name}Middleware = middleware(async ({ ctx, next }) => {
  // TODO: Implement middleware logic
  console.log('${capitalize(name)} middleware executed');
  
  // Call next middleware
  return next();
});
`;

        await FileManager.writeFile(middlewarePath, middlewareContent);

        logger.succeedSpinner(`Middleware ${name} generated successfully`);
        logger.newLine();
        logger.info('Generated files:');
        logger.log(`  src/middleware/${name}.middleware.ts`);

    } catch (error) {
        logger.failSpinner();
        logger.error(`Failed to generate middleware: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
