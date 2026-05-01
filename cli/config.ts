import { join } from "@std/path";

export interface Config {
    registryUrl: string;
    token: string;
}

export async function readConfig(): Promise<Config | null> {
    try {
        const text = await Deno.readTextFile(_configPath());
        return JSON.parse(text) as Config;
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) return null;
        throw e;
    }
}

export async function writeConfig(config: Config): Promise<void> {
    const dir = _configDir();
    await Deno.mkdir(dir, { recursive: true });
    await Deno.writeTextFile(_configPath(), JSON.stringify(config, null, 2));
}

function _configDir(): string {
    return join(Deno.env.get("HOME") ?? ".", ".config", "srce");
}

function _configPath(): string {
    return join(_configDir(), "config.json");
}
