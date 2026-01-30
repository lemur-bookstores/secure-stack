/**
 * Service Mesh Example
 * Demonstrates secure service-to-service communication
 */

import { SecureMesh } from '@lemur-bookstores/secure-stack-mesh';

// Service 1: User Service
const userService = new SecureMesh({
    serviceId: 'user-service',
    port: 50051,
    security: {
        rsaKeySize: 4096,
        aesKeySize: 256,
    },
    discovery: {
        services: [
            { id: 'order-service', host: 'localhost', port: 50052 },
            { id: 'payment-service', host: 'localhost', port: 50053 },
        ],
    },
});

// Service 2: Order Service
const orderService = new SecureMesh({
    serviceId: 'order-service',
    port: 50052,
    security: {
        rsaKeySize: 4096,
        aesKeySize: 256,
    },
    discovery: {
        services: [
            { id: 'user-service', host: 'localhost', port: 50051 },
            { id: 'payment-service', host: 'localhost', port: 50053 },
        ],
    },
});

async function main() {
    console.log('🔐 SecureStack Service Mesh Demo\n');

    // Initialize both services
    console.log('📡 Initializing services...');
    await userService.initialize();
    await orderService.initialize();

    console.log('\n✅ Services initialized\n');

    // User service calls order service
    console.log('🔄 User service → Order service communication:');
    const orderClient = userService.connect('order-service');

    const createOrderResponse = await orderClient.call('createOrder', {
        userId: 'user123',
        items: [
            { productId: 'prod1', quantity: 2 },
            { productId: 'prod2', quantity: 1 },
        ],
        total: 99.99,
    });

    console.log('Response:', createOrderResponse);

    // Get mesh statistics
    console.log('\n📊 Mesh Statistics:');
    console.log('User Service:', userService.getStats());
    console.log('Order Service:', orderService.getStats());

    // Health check
    console.log('\n🏥 Health Check:');
    const userHealth = await userService.healthCheck();
    const orderHealth = await orderService.healthCheck();
    console.log('User Service:', userHealth);
    console.log('Order Service:', orderHealth);

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await userService.cleanup();
    await orderService.cleanup();

    console.log('\n✅ Demo completed!\n');

    console.log('🔐 Security Features Demonstrated:');
    console.log('  ✓ RSA-4096 key generation and persistence');
    console.log('  ✓ AES-256-GCM session encryption');
    console.log('  ✓ JWT mutual authentication');
    console.log('  ✓ HMAC-SHA256 message integrity');
    console.log('  ✓ Session management');
    console.log('  ✓ Service discovery');
}

main().catch(console.error);
