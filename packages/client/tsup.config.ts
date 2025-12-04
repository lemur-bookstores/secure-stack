import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        'react/index': 'src/react/index.ts',
        'vue/index': 'src/vue/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: false, // We use tsc for .d.ts files
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: false,
    treeshake: true,
    external: ['react', 'react-dom', 'vue'],
});
