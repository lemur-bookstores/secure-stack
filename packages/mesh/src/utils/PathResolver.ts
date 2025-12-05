import * as path from 'path';
import * as fs from 'fs';

/**
 * PathResolver - Utility for resolving and managing file paths
 * 
 * Provides a consistent way to resolve paths with fallback strategy:
 * 1. Use explicitly configured path
 * 2. Resolve relative to process.cwd()
 * 3. Create directory if it doesn't exist
 */
export class PathResolver {
    /**
     * Resolve a path with fallback to default
     * @param configPath - User-configured path (can be relative or absolute)
     * @param defaultPath - Default path relative to cwd
     * @returns Absolute path
     */
    static resolve(configPath: string | undefined, defaultPath: string): string {
        const targetPath = configPath || defaultPath;

        // If absolute, use as-is
        if (path.isAbsolute(targetPath)) {
            return targetPath;
        }

        // Otherwise, resolve relative to cwd
        return path.resolve(process.cwd(), targetPath);
    }

    /**
     * Ensure a directory exists, create if it doesn't
     * @param dirPath - Directory path to ensure
     */
    static ensureDir(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    /**
     * Resolve and ensure directory exists
     * @param configPath - User-configured path
     * @param defaultPath - Default path
     * @returns Absolute path to directory
     */
    static resolveAndEnsureDir(configPath: string | undefined, defaultPath: string): string {
        const resolved = this.resolve(configPath, defaultPath);
        this.ensureDir(resolved);
        return resolved;
    }

    /**
     * Resolve a file path and ensure its parent directory exists
     * @param configPath - User-configured file path
     * @param defaultPath - Default file path
     * @returns Absolute path to file
     */
    static resolveFile(configPath: string | undefined, defaultPath: string): string {
        const resolved = this.resolve(configPath, defaultPath);
        const dir = path.dirname(resolved);
        this.ensureDir(dir);
        return resolved;
    }
}
