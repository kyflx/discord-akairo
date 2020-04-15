import { Message } from "discord.js";
import { Command } from "./Command";

/**
 * Represents a special return value during commmand execution or argument parsing.
 */
export class Flag {
  command?: Command;
  ignore?: boolean;
  rest?: string;
  message?: Message;
  value?: any;

  public constructor(public type: string, data: Record<string, any> = {}) {
    Object.assign(this, data);
  }

  /**
   * Creates a flag that cancels the command.
   */
  public static cancel() {
    return new Flag("cancel");
  }

  /**
   * Creates a flag that retries with another input.
   */
  public static retry(message: Message) {
    return new Flag("retry", { message });
  }

  /**
   * Creates a flag that acts as argument cast failure with extra data.
   */
  public static fail(value: any): Flag {
    return new Flag("fail", { value });
  }

  /**
   * Creates a flag that runs another command with the rest of the arguments.
   * @param {string} command - Command ID.
   * @param {boolean} [ignore=false] - Whether or not to ignore permission checks.
   * @param {string} [rest] - The rest of the arguments.
   */
  public static continue(
    command: Command,
    ignore: boolean = false,
    rest: string = null
  ) {
    return new Flag("continue", { command, ignore, rest });
  }

  /**
   * Checks if a value is a flag and of some type.
   * @param {any} value - Value to check.
   * @param {string} type - Type of flag.
   */
  public static is(value: any, type: string): boolean {
    return value instanceof Flag && value.type === type;
  }
}
