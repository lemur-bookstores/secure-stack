declare module 'memjs' {
    export interface ClientOptions {
        retries?: number;
        retry_delay?: number;
        expires?: number;
        logger?: any;
        timeout?: number;
        conntimeout?: number;
        keepAlive?: boolean;
        keepAliveDelay?: number;
        username?: string;
        password?: string;
    }

    export class Client {
        static create(servers?: string, options?: ClientOptions): Client;
        get(key: string): Promise<{ value: Buffer | null; flags: Buffer }>;
        set(key: string, value: string | Buffer, options?: { expires?: number }): Promise<boolean>;
        delete(key: string): Promise<boolean>;
        flush(): Promise<void>;
        close(): void;
    }
}
