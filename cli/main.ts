import { defineCommand, runMain } from "@unjs/citty";
import { infoCmd } from "./commands/info.ts";
import { initCmd } from "./commands/init.ts";
import { listCmd } from "./commands/list.ts";
import { loginCmd } from "./commands/login.ts";
import { publishCmd } from "./commands/publish.ts";
import { tokenCmd } from "./commands/token.ts";

const mainCmd = defineCommand({
    meta: { name: "srce", description: "srce private package registry CLI" },
    subCommands: { init: initCmd, login: loginCmd, publish: publishCmd, token: tokenCmd, list: listCmd, info: infoCmd }
});

runMain(mainCmd);
