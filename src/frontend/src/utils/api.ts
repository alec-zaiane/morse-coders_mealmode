import * as axios from 'axios';

export async function fetchAllPages<T>(initial: axios.AxiosResponse<{ results: T[]; next?: string | null }>): Promise<T[]> {
    const results: T[] = [];

    results.push(...initial.data.results);

    let nextUrl = initial.data.next ?? null;
    while (nextUrl) {
        const nextResponse = await axios.default.get<{ results: T[]; next: string | null }>(nextUrl);
        results.push(...nextResponse.data.results);
        nextUrl = nextResponse.data.next ?? null;
    }

    return results;
}