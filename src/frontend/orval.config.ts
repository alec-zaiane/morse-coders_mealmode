import { defineConfig } from 'orval';

export default defineConfig({
    petstore: {
        input: './schema.yaml',
        output: {
            target: './src/api',
            baseUrl: 'https://localhost:8000'
        }
    },
});