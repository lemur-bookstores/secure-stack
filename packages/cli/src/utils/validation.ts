import { z } from 'zod';

export class Validation {
    /**
     * Validate project name
     */
    static projectName(name: string): { valid: boolean; error?: string } {
        const schema = z.string()
            .min(1, 'Project name cannot be empty')
            .max(50, 'Project name is too long')
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Project name must contain only lowercase letters and numbers, separated by hyphens')
            .regex(/^[a-z]/, 'Project name must start with a letter');

        const result = schema.safeParse(name);

        if (!result.success) {
            const { message, errors: [errorMessage] } = result.error;
            return {
                valid: false,
                error: errorMessage?.message || message,
            };
        }

        return { valid: true };
    }

    /**
     * Validate service/module name
     */
    static componentName(name: string): { valid: boolean; error?: string } {
        const schema = z.string()
            .min(1, 'Name cannot be empty')
            .max(30, 'Name is too long')
            .regex(/^[a-zA-Z][a-zA-Z0-9-]*$/, 'Name must start with a letter and contain only letters, numbers, and hyphens');

        const result = schema.safeParse(name);

        if (!result.success) {
            const { message, errors: [errorMessage] } = result.error;
            return {
                valid: false,
                error: errorMessage?.message || message,
            };
        }

        return { valid: true };
    }

    /**
     * Validate port number
     */
    static port(port: string | number): { valid: boolean; error?: string } {
        const portNum = typeof port === 'string' ? parseInt(port, 10) : port;

        if (isNaN(portNum)) {
            return { valid: false, error: 'Port must be a number' };
        }

        if (portNum < 1 || portNum > 65535) {
            return { valid: false, error: 'Port must be between 1 and 65535' };
        }

        return { valid: true };
    }
}
