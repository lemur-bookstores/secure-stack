import { v4 as uuidv4 } from 'uuid';

export interface Session {
    id: string;
    serviceId: string; // The remote service ID
    sessionKey: Buffer; // The shared AES key
    createdAt: number;
    lastActivity: number;
    expiresAt: number;
    metadata?: Record<string, any>;
}

export class SessionManager {
    private sessions: Map<string, Session> = new Map();
    private readonly defaultTTL: number; // in milliseconds

    constructor(defaultTTL: number = 3600000) { // 1 hour default
        this.defaultTTL = defaultTTL;
    }

    /**
     * Creates a new session
     */
    public createSession(serviceId: string, sessionKey: Buffer, metadata?: Record<string, any>): Session {
        const id = uuidv4();
        const now = Date.now();
        const session: Session = {
            id,
            serviceId,
            sessionKey,
            createdAt: now,
            lastActivity: now,
            expiresAt: now + this.defaultTTL,
            metadata,
        };

        this.sessions.set(id, session);
        return session;
    }

    /**
     * Gets a session by ID
     */
    public getSession(id: string): Session | undefined {
        const session = this.sessions.get(id);
        if (!session) return undefined;

        if (this.isExpired(session)) {
            this.sessions.delete(id);
            return undefined;
        }

        // Update activity
        session.lastActivity = Date.now();
        session.expiresAt = session.lastActivity + this.defaultTTL; // Sliding expiration

        return session;
    }

    /**
     * Gets a session by Service ID (assuming one active session per service pair for simplicity, or just finding one)
     */
    public getSessionByServiceId(serviceId: string): Session | undefined {
        for (const session of this.sessions.values()) {
            if (session.serviceId === serviceId) {
                if (this.isExpired(session)) {
                    this.sessions.delete(session.id);
                    continue;
                }
                return session;
            }
        }
        return undefined;
    }

    /**
     * Invalidates/Removes a session
     */
    public invalidateSession(id: string): void {
        this.sessions.delete(id);
    }

    /**
     * Cleans up expired sessions
     */
    public cleanupExpiredSessions(): void {
        for (const [id, session] of this.sessions.entries()) {
            if (this.isExpired(session)) {
                this.sessions.delete(id);
            }
        }
    }

    public getStats(): { activeSessions: number } {
        return {
            activeSessions: this.sessions.size,
        };
    }

    private isExpired(session: Session): boolean {
        return Date.now() > session.expiresAt;
    }
}
