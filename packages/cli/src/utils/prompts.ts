import inquirer from 'inquirer';

export type ProjectType = 'monolith' | 'microservices' | 'hybrid';
export type DatabaseType = 'prisma' | 'drizzle' | 'none';

export interface ProjectOptions {
    name: string;
    type: ProjectType;
    features: string[];
    database: DatabaseType;
    installDeps: boolean;
}

export class Prompts {
    /**
     * Prompt for project type
     */
    static async projectType(): Promise<ProjectType> {
        const { type } = await inquirer.prompt([
            {
                type: 'list',
                name: 'type',
                message: 'Select project type:',
                choices: [
                    { name: 'Monolith (Single service)', value: 'monolith' },
                    { name: 'Microservices (Multiple services)', value: 'microservices' },
                    { name: 'Hybrid (Monolith + Microservices)', value: 'hybrid' },
                ],
                default: 'monolith',
            },
        ]);
        return type;
    }

    /**
     * Prompt for features selection
     */
    static async features(): Promise<string[]> {
        const { features } = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'features',
                message: 'Select features:',
                choices: [
                    { name: 'Authentication (@lemur-bookstores/auth)', value: 'auth', checked: true },
                    { name: 'RBAC (@lemur-bookstores/rbac)', value: 'rbac', checked: true },
                    { name: 'Service Mesh (@lemur-bookstores/mesh)', value: 'mesh', checked: true },
                    { name: 'Rate Limiting (@lemur-bookstores/rate-limit)', value: 'rate-limit', checked: false },
                    { name: 'Audit Logging (@lemur-bookstores/audit)', value: 'audit', checked: false },
                    { name: 'Cache (@lemur-bookstores/cache)', value: 'cache', checked: false },
                    { name: 'Storage (@lemur-bookstores/storage)', value: 'storage', checked: false },
                ],
            },
        ]);
        return features;
    }

    /**
     * Prompt for database selection
     */
    static async database(): Promise<DatabaseType> {
        const { database } = await inquirer.prompt([
            {
                type: 'list',
                name: 'database',
                message: 'Select database:',
                choices: [
                    { name: 'Prisma', value: 'prisma' },
                    { name: 'Drizzle ORM', value: 'drizzle' },
                    { name: 'None', value: 'none' },
                ],
                default: 'prisma',
            },
        ]);
        return database;
    }

    /**
     * Prompt for confirmation
     */
    static async confirm(message: string, defaultValue = true): Promise<boolean> {
        const { confirmed } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmed',
                message,
                default: defaultValue,
            },
        ]);
        return confirmed;
    }

    /**
     * Prompt for text input
     */
    static async input(message: string, defaultValue?: string): Promise<string> {
        const { value } = await inquirer.prompt([
            {
                type: 'input',
                name: 'value',
                message,
                default: defaultValue,
            },
        ]);
        return value;
    }
}
