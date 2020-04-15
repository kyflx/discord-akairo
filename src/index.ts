import { CommandUtil } from "./struct";

export const version = require("../package.json").version;
export * from "./providers";
export * from "./struct";
export * from "./util";

declare module "discord.js" {
  interface Message {
    util: CommandUtil;
    edited: boolean;
  }
}

