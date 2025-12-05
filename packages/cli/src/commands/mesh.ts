import { logger } from '../utils/logger.js';
import picocolors from 'picocolors';
import ora from 'ora';

async function fetchJson(url: string, options?: RequestInit) {
    try {
        const res = await fetch(url, options);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }
        return await res.json();
    } catch (error) {
        throw new Error(`Failed to connect to ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function meshStatus(options: { url: string }) {
    const spinner = ora(`Checking status for ${picocolors.cyan(options.url)}...`).start();
    try {
        const status = await fetchJson(`${options.url}/mesh/status`);
        spinner.succeed('Mesh status retrieved');

        logger.newLine();
        logger.info(JSON.stringify(status, null, 2));
    } catch (error) {
        spinner.fail('Failed to retrieve mesh status');
        logger.error(error instanceof Error ? error.message : String(error));
    }
}

export async function meshHealth(options: { url: string }) {
    const spinner = ora(`Checking health for ${picocolors.cyan(options.url)}...`).start();
    try {
        const health = await fetchJson(`${options.url}/health`);
        spinner.succeed('Health check passed');

        logger.newLine();
        logger.info(JSON.stringify(health, null, 2));
    } catch (error) {
        spinner.fail('Health check failed');
        logger.error(error instanceof Error ? error.message : String(error));
    }
}

export async function meshRotateKeys(options: { url: string }) {
    const spinner = ora(`Rotating keys for ${picocolors.cyan(options.url)}...`).start();
    try {
        const result = await fetchJson(`${options.url}/mesh/keys/rotate`, {
            method: 'POST'
        });
        spinner.succeed('Keys rotated successfully');

        logger.newLine();
        logger.info(JSON.stringify(result, null, 2));
    } catch (error) {
        spinner.fail('Failed to rotate keys');
        logger.error(error instanceof Error ? error.message : String(error));
    }
}

export async function meshVisualize(options: { url?: string } = {}) {
    const url = options.url || 'http://localhost:3000';
    const spinner = ora(`Fetching topology from ${picocolors.cyan(url)}...`).start();

    try {
        const status: any = await fetchJson(`${url}/mesh/status`);
        spinner.stop();

        logger.newLine();
        logger.box('Mesh Topology', 'SecureStack Mesh');

        const serviceId = status.service || 'Unknown Service';
        console.log(`${picocolors.green('●')} ${picocolors.bold(serviceId)}`);

        if (status.connectedServices && Array.isArray(status.connectedServices)) {
            status.connectedServices.forEach((peer: string, index: number, array: string[]) => {
                const isLast = index === array.length - 1;
                const prefix = isLast ? '└──' : '├──';
                console.log(`  ${prefix} ${picocolors.blue('○')} ${peer}`);
            });
        } else {
            console.log(`  └── ${picocolors.dim('(No connected peers)')}`);
        }

        logger.newLine();
    } catch (error) {
        spinner.fail('Failed to visualize mesh');
        logger.error(error instanceof Error ? error.message : String(error));
    }
}

