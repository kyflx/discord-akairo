import { AkairoModuleOptions, AkairoModule } from "../AkairoModule";
import { Message } from "discord.js";
import { InhibitorHandler } from "./InhibitorHandler";
import { Command } from "../commands/Command";
import { AkairoError } from "../../util";
import { CommandContext } from "../commands";

export type InhibitorType = "all" | "pre" | "post";
export interface InhibitorOptions extends AkairoModuleOptions {
  reason?: string;
  type?: InhibitorType;
  priority?: number;
}

export class Inhibitor extends AkairoModule {
  public handler: InhibitorHandler;

  public reason: string;
  public type: InhibitorType;
  public priority: number;

  public constructor(
    id: string,
    {
      category,
      reason = "",
      type = "post",
      priority = 0,
    }: InhibitorOptions = {}
  ) {
    super(id, { category });
    this.reason = reason;
    this.type = type;
    this.priority = priority;
  }

  public exec(message: Message | CommandContext, command?: Command): Promise<boolean> | boolean {
    throw new AkairoError("NOT_IMPLEMENTED", this.constructor.name, "exec");
  }
}
