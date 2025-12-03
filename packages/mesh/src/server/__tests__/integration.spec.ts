import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SecureMeshServer } from '../SecureMeshServer';
import { SecureMeshClient } from '../../client/SecureMeshClient';
import path from 'path';
import fs from 'fs';

const TEST_KEYS_DIR = path.join(__dirname, 'test-integration-keys');
const PORT = 50051;

describe('Secure Mesh Integration', () => {
    let server: SecureMeshServer;
    let client: SecureMeshClient;

    beforeAll(async () => {
        // Clean up keys dir
        if (fs.existsSync(TEST_KEYS_DIR)) {
            fs.rmSync(TEST_KEYS_DIR, { recursive: true, force: true });
        }

        // Start Server
        server = new SecureMeshServer('server-service', TEST_KEYS_DIR);
        await server.start(PORT);

        // Initialize Client
        client = new SecureMeshClient('client-service', 'server-service', `127.0.0.1:${PORT}`, TEST_KEYS_DIR);
    });

    afterAll(() => {
        server.stop();
        if (fs.existsSync(TEST_KEYS_DIR)) {
            fs.rmSync(TEST_KEYS_DIR, { recursive: true, force: true });
        }
    });

    it('should perform handshake and establish session', async () => {
        await client.connect();
        // If connect resolves, handshake was successful
        expect(true).toBe(true);
    });

    it('should send and receive encrypted messages', async () => {
        const message = 'Hello Secure World';
        const response = await client.sendMessage(message);

        expect(response).toBe(`Echo: ${message}`);
    });
});
