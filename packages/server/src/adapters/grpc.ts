import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import type { SecureStack } from '@lemur-bookstores/secure-stack-core';

export interface GRPCAdapterConfig {
    protoPath: string;
    packageName: string;
    serviceName: string;
    url: string;
}

export class GRPCAdapter {
    private server: grpc.Server;
    private config: GRPCAdapterConfig;

    constructor(_secureStack: SecureStack, config: GRPCAdapterConfig) {
        this.config = config;
        this.server = new grpc.Server();
    }

    async start() {
        console.log(`[GRPCAdapter] Loading proto from ${this.config.protoPath}`);

        const packageDefinition = protoLoader.loadSync(this.config.protoPath, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        });

        const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
        const pkg = protoDescriptor[this.config.packageName] as any;
        const service = pkg[this.config.serviceName];

        this.server.addService(service.service, this.createServiceImplementation());

        return new Promise<void>((resolve, reject) => {
            this.server.bindAsync(
                this.config.url,
                grpc.ServerCredentials.createInsecure(), // TODO: Implement secure credentials
                (err, port) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    console.log(`[GRPCAdapter] Server bound to port ${port}`);
                    this.server.start();
                    resolve();
                }
            );
        });
    }

    async stop() {
        return new Promise<void>((resolve) => {
            this.server.tryShutdown(() => {
                console.log('[GRPCAdapter] Server stopped');
                resolve();
            });
        });
    }

    private createServiceImplementation() {
        // This would dynamically map gRPC calls to SecureStack router procedures
        // For now, returning a placeholder implementation
        return {
            // Example method
            HealthCheck: (_call: grpc.ServerUnaryCall<unknown, unknown>, callback: grpc.sendUnaryData<unknown>) => {
                callback(null, { status: 'SERVING' });
            }
        };
    }
}
