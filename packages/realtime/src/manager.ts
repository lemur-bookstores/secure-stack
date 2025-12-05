import { Server, Socket, ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { RealtimeConfig, RealtimeMessage } from './interfaces/index.js';
import { Server as HttpServer } from 'http';

export class RealtimeManager {
    private io: Server;
    private redisPub?: Redis;
    private redisSub?: Redis;

    constructor(config: RealtimeConfig = {}, httpServer?: HttpServer) {
        const options: Partial<ServerOptions> = {
            path: config.path || '/socket.io',
            cors: config.cors || { origin: '*' },
        };

        if (httpServer) {
            this.httpServer = httpServer;
            this.io = new Server(httpServer, options);
        } else {
            this.io = new Server(options);
        }

        if (config.redis) {
            this.setupRedis(config.redis);
        }

        if (config.port && !httpServer) {
            this.io.listen(config.port);
            console.log(`Realtime server listening on port ${config.port}`);
        }

        this.setupDefaultHandlers();
    }

    private setupRedis(redisConfig: { host: string; port: number; password?: string }) {
        this.redisPub = new Redis(redisConfig);
        this.redisSub = new Redis(redisConfig);

        this.io.adapter(createAdapter(this.redisPub, this.redisSub));
        console.log('Redis adapter configured for RealtimeManager');
    }

    private setupDefaultHandlers() {
        this.io.on('connection', (socket: Socket) => {
            // console.log(`Socket connected: ${socket.id}`);

            socket.on('disconnect', () => {
                // console.log(`Socket disconnected: ${socket.id}`);
            });
        });
    }

    public getServer(): Server {
        return this.io;
    }

    public emit(message: RealtimeMessage): void {
        const { event, data, room, namespace } = message;
        let target: any = this.io;

        if (namespace) {
            target = this.io.of(namespace);
        }

        if (room) {
            target = target.to(room);
        }

        target.emit(event, data);
    }

    public join(socketId: string, room: string | string[], namespace: string = '/'): void {
        const socket = this.io.of(namespace).sockets.get(socketId);
        if (socket) {
            socket.join(room);
        }
    }

    public leave(socketId: string, room: string, namespace: string = '/'): void {
        const socket = this.io.of(namespace).sockets.get(socketId);
        if (socket) {
            socket.leave(room);
        }
    }

    public async close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.io.close((err) => {
                if (err) return reject(err);

                if (this.redisPub) this.redisPub.disconnect();
                if (this.redisSub) this.redisSub.disconnect();

                resolve();
            });
        });
    }
}
