import path from 'path';
import fs from 'fs-extra';
import { logger } from '../utils/logger.js';
import { FileManager } from '../utils/files.js';

export async function deploy() {
    logger.info('Checking for deployment scripts...');

    const pkg = await FileManager.readJson('package.json');
    if (pkg?.scripts?.deploy) {
        logger.info('Running npm run deploy...');
        const { execa } = await import('execa');
        await execa('npm', ['run', 'deploy'], { stdio: 'inherit' });
    } else {
        logger.warn('No "deploy" script found in package.json');
        logger.info('Please configure your deployment pipeline or add a deploy script.');
    }
}

export async function docker() {
    logger.info('Generating Docker configuration...');

    const dockerfileContent = `# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
`;

    const dockerComposeContent = `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: always
`;

    try {
        const cwd = process.cwd();
        const dockerfilePath = path.join(cwd, 'Dockerfile');
        const composePath = path.join(cwd, 'docker-compose.yml');

        if (await fs.pathExists(dockerfilePath)) {
            logger.warn('Dockerfile already exists. Skipping...');
        } else {
            await fs.writeFile(dockerfilePath, dockerfileContent);
            logger.success('Created Dockerfile');
        }

        if (await fs.pathExists(composePath)) {
            logger.warn('docker-compose.yml already exists. Skipping...');
        } else {
            await fs.writeFile(composePath, dockerComposeContent);
            logger.success('Created docker-compose.yml');
        }

    } catch (error) {
        logger.error('Failed to generate Docker files');
        logger.error(error instanceof Error ? error.message : String(error));
    }
}

