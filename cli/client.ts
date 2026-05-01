import type { Config } from "./config.ts";
import { readConfig } from "./config.ts";

export type { Config };

export async function resolveAuth(): Promise<Config> {
    const config = await readConfig();
    if (!config) throw new Error("Not logged in. Run: srce login");
    return config;
}

export async function apiCall<T = void>(
    config: Config,
    method: string,
    path: string,
    options?: { body?: BodyInit; contentType?: string }
): Promise<T> {
    const headers: Record<string, string> = { authorization: `Bearer ${config.token}` };
    if (options?.body !== undefined && options.contentType) {
        headers["content-type"] = options.contentType;
    }
    const res = await fetch(`${config.registryUrl}${path}`, {
        method,
        headers,
        body: options?.body
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}
