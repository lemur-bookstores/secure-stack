import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts', 'src/cli.ts'],
    format: ['esm'],
    dts: false,  // Disable for now due to config issues
    splitting: false,
    sourcemap: true,
    clean: true,
    shims: true,
    target: 'node18',
});
