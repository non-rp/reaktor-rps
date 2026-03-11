import type { RawHistoryResponse } from "../types/raw";

export async function fetchHistory(cursor?: string): Promise<RawHistoryResponse> {
    const baseUrl = process.env.RPS_BASE_URL;
    const apiToken = process.env.RPS_API_TOKEN;
    if (!baseUrl || !apiToken) {
        throw new Error("RPS_BASE_URL and RPS_API_TOKEN must be set in environment variables");
    }

    const response = await fetch(buildHistoryUrl(baseUrl, cursor), {
        headers: {
            "Authorization": `Bearer ${apiToken}`
        }
    })

    if(!response.ok) {
        throw new Error(`Failed to fetch history: ${response.status} ${response.statusText}`);
    }

    const responseJson = await response.json();
    return responseJson as RawHistoryResponse;
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
