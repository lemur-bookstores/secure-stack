import { App, inject, InjectionKey } from 'vue';
import { VueQueryPlugin, QueryClient, VueQueryPluginOptions } from '@tanstack/vue-query';
import { SecureStackClient } from '../client';
import { ClientConfig } from '../types';

export const SecureStackClientKey: InjectionKey<SecureStackClient> = Symbol('SecureStackClient');

export interface SecureStackPluginOptions {
    config: ClientConfig;
    queryClient?: QueryClient;
    vueQueryOptions?: VueQueryPluginOptions;
}

export const SecureStackPlugin = {
    install(app: App, options: SecureStackPluginOptions) {
        const client = new SecureStackClient(options.config);
        app.provide(SecureStackClientKey, client);

        const queryClient = options.queryClient || new QueryClient();

        app.use(VueQueryPlugin, {
            queryClient,
            ...options.vueQueryOptions
        });
    }
};

export function useClient(): SecureStackClient {
    const client = inject(SecureStackClientKey);
    if (!client) {
        throw new Error('SecureStackClient not found. Did you install the SecureStackPlugin?');
    }
    return client;
}
