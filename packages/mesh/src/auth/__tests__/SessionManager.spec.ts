import { describe, it, expect, beforeEach } from 'vitest';
import { SessionManager } from '../SessionManager';
import { randomBytes } from 'crypto';

describe('SessionManager', () => {
    let sessionManager: SessionManager;

    beforeEach(() => {
        sessionManager = new SessionManager(1000); // 1 second TTL for testing
    });

    it('should create and retrieve a session', () => {
        const key = randomBytes(32);
        const session = sessionManager.createSession('service-b', key);

        expect(session).toBeDefined();
        expect(session.serviceId).toBe('service-b');
        expect(session.sessionKey).toEqual(key);

        const retrieved = sessionManager.getSession(session.id);
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(session.id);
    });

    it('should expire sessions', async () => {
        const key = randomBytes(32);
        const session = sessionManager.createSession('service-b', key);

        // Wait for expiration
        await new Promise(resolve => setTimeout(resolve, 1100));

        const retrieved = sessionManager.getSession(session.id);
        expect(retrieved).toBeUndefined();
    });

    it('should extend session on access', async () => {
        const key = randomBytes(32);
        const session = sessionManager.createSession('service-b', key);

        // Wait half TTL
        await new Promise(resolve => setTimeout(resolve, 600));

        // Access session
        const retrieved = sessionManager.getSession(session.id);
        expect(retrieved).toBeDefined();

        // Wait another half TTL (total > 1s from start, but < 1s from access)
        await new Promise(resolve => setTimeout(resolve, 600));

        const retrievedAgain = sessionManager.getSession(session.id);
        expect(retrievedAgain).toBeDefined();
    });

    it('should invalidate session', () => {
        const key = randomBytes(32);
        const session = sessionManager.createSession('service-b', key);

        sessionManager.invalidateSession(session.id);
        expect(sessionManager.getSession(session.id)).toBeUndefined();
    });
});
