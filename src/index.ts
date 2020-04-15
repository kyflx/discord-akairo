import { CommandContext } from "./struct";

export const version = require("../package.json").version;
export * from "./providers";
export * from "./util";

declare module "discord.js" {
  interface Message {
    util: CommandContext;
    edited: boolean;
  }
}

