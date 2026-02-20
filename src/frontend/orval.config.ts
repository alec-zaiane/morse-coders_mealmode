import { defineConfig } from 'orval';

export default defineConfig({
    petstore: {
        input: './schema.yaml',
        output: {
            target: './src/api',
            baseUrl: 'http://localhost:8000',
            client: 'react-query'
        }
    },
});