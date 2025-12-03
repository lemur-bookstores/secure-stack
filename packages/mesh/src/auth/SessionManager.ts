/**
 * Session Manager
 * Manages secure sessions between services
 */

import * as crypto from 'crypto';

export interface Session {
    id: string;
    serviceId: string;
    publicKey: string;
    sessionKey: Buffer;
    createdAt: Date;
    lastActivity: Date;
    messageCount: number;
}

export class SessionManager {
    private sessions: Map<string, Session> = new Map();
    private sessionTimeout: number; // in milliseconds

    constructor(options: { sessionTimeout?: number } = {}) {
        this.sessionTimeout = options.sessionTimeout || 3600000; // 1 hour default
    }

    /**
     * Create a new session
     */
    createSession(serviceId: string, publicKey: string, sessionKey: Buffer): Session {
        const sessionId = crypto.randomBytes(16).toString('hex');

        const session: Session = {
            id: sessionId,
            serviceId,
            publicKey,
            sessionKey,
            createdAt: new Date(),
            lastActivity: new Date(),
            messageCount: 0,
        };

        this.sessions.set(sessionId, session);

        console.log(`[SessionManager] Created session ${sessionId} for ${serviceId}`);

        return session;
    }

    /**
     * Get session by ID
     */
    getSession(sessionId: string): Session | undefined {
        const session = this.sessions.get(sessionId);

        if (!session) {
            return undefined;
        }

        // Check if session expired
        if (this.isSessionExpired(session)) {
            this.deleteSession(sessionId);
            return undefined;
        }

        // Update last activity
        session.lastActivity = new Date();

        return session;
    }

    /**
     * Get session by service ID
     */
    getSessionByServiceId(serviceId: string): Session | undefined {
        for (const session of this.sessions.values()) {
            if (session.serviceId === serviceId && !this.isSessionExpired(session)) {
                session.lastActivity = new Date();
                return session;
            }
        }
        return undefined;
    }

    /**
     * Delete session
     */
    deleteSession(sessionId: string): boolean {
        const deleted = this.sessions.delete(sessionId);
        if (deleted) {
            console.log(`[SessionManager] Deleted session ${sessionId}`);
        }
        return deleted;
    }

    /**
     * Increment message count for session
     */
    incrementMessageCount(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.messageCount++;
            session.lastActivity = new Date();
        }
    }

    /**
     * Check if session is expired
     */
    private isSessionExpired(session: Session): boolean {
        const now = Date.now();
        const lastActivity = session.lastActivity.getTime();
        return now - lastActivity > this.sessionTimeout;
    }

    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions(): number {
        let cleanedCount = 0;

        for (const [sessionId, session] of this.sessions.entries()) {
            if (this.isSessionExpired(session)) {
                this.sessions.delete(sessionId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`[SessionManager] Cleaned up ${cleanedCount} expired session(s)`);
        }

        return cleanedCount;
    }

    /**
     * Get all active sessions
     */
    getActiveSessions(): Session[] {
        return Array.from(this.sessions.values()).filter(
            session => !this.isSessionExpired(session)
        );
    }

    /**
     * Get session statistics
     */
    getStats() {
        const sessions = this.getActiveSessions();

        return {
            totalSessions: sessions.length,
            totalMessages: sessions.reduce((sum, s) => sum + s.messageCount, 0),
            oldestSession: sessions.reduce(
                (oldest, s) => (s.createdAt < oldest ? s.createdAt : oldest),
                new Date()
            ),
        };
    }
}
