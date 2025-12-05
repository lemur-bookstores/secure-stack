import fs from 'fs-extra';
import path from 'path';

export class FileManager {
    /**
     * Check if a file or directory exists
     */
    static exists(filePath: string): boolean {
        return fs.existsSync(filePath);
    }

    /**
     * Create a directory recursively
     */
    static async createDir(dirPath: string): Promise<void> {
        await fs.ensureDir(dirPath);
    }

    /**
     * Write content to a file
     */
    static async writeFile(filePath: string, content: string): Promise<void> {
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, content, 'utf-8');
    }

    /**
     * Read file content
     */
    static async readFile(filePath: string): Promise<string> {
        return await fs.readFile(filePath, 'utf-8');
    }

    /**
     * Copy file or directory
     */
    static async copy(src: string, dest: string): Promise<void> {
        await fs.copy(src, dest);
    }

    /**
     * Remove file or directory
     */
    static async remove(filePath: string): Promise<void> {
        await fs.remove(filePath);
    }

    /**
     * Check if path is a directory
     */
    static async isDirectory(filePath: string): Promise<boolean> {
        const stats = await fs.stat(filePath);
        return stats.isDirectory();
    }

    /**
     * List directory contents
     */
    static async readDir(dirPath: string): Promise<string[]> {
        return await fs.readdir(dirPath);
    }

    /**
     * Get absolute path
     */
    static resolve(...paths: string[]): string {
        return path.resolve(...paths);
    }

    /**
     * Join paths
     */
    static join(...paths: string[]): string {
        return path.join(...paths);
    }
}
