import { RealtimeManager } from './manager.js';
import { RealtimeConfig } from './interfaces/index.js';
import { socketAuthMiddleware } from './middleware/auth.js';

export interface SecureStackServerLike {
    getHttpServer(): any;
    registerProvider(name: string, provider: any): any;
    auth?: any;
}

export function useRealtime(server: SecureStackServerLike, config: RealtimeConfig): RealtimeManager {
    const realtime = new RealtimeManager(config, server.getHttpServer());

    // Auto-configure auth if available and not explicitly disabled
    if (config.auth !== false && server.auth && server.auth.jwt) {
        realtime.getServer().use(socketAuthMiddleware({
            verify: async (token: string) => {
                return server.auth.jwt.verifyToken(token);
            }
        }));
    }

    server.registerProvider('realtime', realtime);
    return realtime;
}
