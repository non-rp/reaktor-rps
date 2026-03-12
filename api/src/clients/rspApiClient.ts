import type { RawHistoryResponse } from "../types/raw";

const MAX_HISTORY_RETRIES = 5;
const BASE_RETRY_DELAY_MS = 1000;
const HISTORY_FETCH_TIMEOUT_MS = 20000;

export async function fetchHistory(cursor?: string): Promise<RawHistoryResponse> {
    const baseUrl = process.env.RPS_BASE_URL;
    const apiToken = process.env.RPS_API_TOKEN;
    if (!baseUrl || !apiToken) {
        throw new Error("RPS_BASE_URL and RPS_API_TOKEN must be set in environment variables");
    }

    const url = buildHistoryUrl(baseUrl, cursor);

    for (let attempt = 1; attempt <= MAX_HISTORY_RETRIES; attempt += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), HISTORY_FETCH_TIMEOUT_MS);

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    "Authorization": `Bearer ${apiToken}`
                }
            })
            clearTimeout(timeout);

            if (response.ok) {
                const responseJson = await response.json();
                return responseJson as RawHistoryResponse;
            }

            if (!shouldRetry(response.status) || attempt === MAX_HISTORY_RETRIES) {
                throw new Error(`Failed to fetch history: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            clearTimeout(timeout);
            if (attempt === MAX_HISTORY_RETRIES) {
                throw error;
            }
        }

        const delayMs = BASE_RETRY_DELAY_MS * attempt;
        console.warn(`History fetch retry ${attempt}/${MAX_HISTORY_RETRIES} for ${url} after ${delayMs}ms`);
        await sleep(delayMs);
    }

    throw new Error(`Failed to fetch history after ${MAX_HISTORY_RETRIES} attempts`);
}

function buildHistoryUrl(baseUrl: string, cursor?: string): string {
    const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

    if (!cursor) {
        return new URL("history", normalizedBaseUrl).toString();
    }

    if (cursor.startsWith("http://") || cursor.startsWith("https://")) {
        return cursor;
    }

    if (cursor.startsWith("/") || cursor.startsWith("history")) {
        return new URL(cursor, normalizedBaseUrl).toString();
    }

    const historyUrl = new URL("history", normalizedBaseUrl);
    historyUrl.searchParams.set("cursor", cursor);
    return historyUrl.toString();
}

function shouldRetry(status: number): boolean {
    return status === 429 || status >= 500;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
