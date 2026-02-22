import { defineConfig } from 'orval';

export default defineConfig({
    mealmode: {
        input: './schema.yaml',
        output: {
            target: './src/api',
            baseUrl: process.env.ORVAL_BASE_URL ?? '/',
            client: 'react-query'
        }
    },
});