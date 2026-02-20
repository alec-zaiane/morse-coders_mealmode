import { defineConfig } from 'orval';

export default defineConfig({
    petstore: {
        input: './schema.yaml',
        output: './src/api',
    },
});