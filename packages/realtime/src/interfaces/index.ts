
export interface RealtimeConfig {
    port?: number;
    path?: string;
    cors?: {
        origin: string | string[];
        methods?: string[];
        credentials?: boolean;
    };
    redis?: {
        host: string;
        port: number;
        password?: string;
    };
    auth?: boolean; // Enable/disable auto-auth integration (default: true)
    adapter?: any; // For flexibility with redis-adapter
}

export interface RealtimeMessage {
    event: string;
    data: any;
    room?: string | string[];
    namespace?: string;
}

export interface SocketUser {
    id: string;
    [key: string]: any;
}

declare module 'socket.io' {
    interface Socket {
        user?: SocketUser;
    }
}
