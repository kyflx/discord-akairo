import { Message, PermissionResolvable } from "discord.js";
import { AkairoError, OrArray, OrPromise } from "../../util";
import { AkairoModule, AkairoModuleOptions } from "../AkairoModule";
import { CommandContext, UsesContext } from "./CommandContext";
import { PrefixSupplier, CommandHandler } from "./CommandHandler";
import { ContentParser } from "./ContentParser";
import { ArgumentGenerator, ArgumentOptions, DefaultArgumentOptions, ArgumentRunner, Argument } from "./arguments";

type Permissions = OrArray<PermissionResolvable> | PermissionSupplier;

export type KeySupplier = (ctx: CommandContext, args?: any) => string;
export type ExecutionPredicate = (ctx: CommandContext) => boolean;
export type IngoreCheckPredicate = (ctx: CommandContext, command?: Command) => boolean;

export interface CommandDescription {
  content?: string;
  usage?: string;
  examples?: string[];
}
export type PermissionSupplier = (
  ctx: CommandContext
) => OrPromise<OrArray<PermissionResolvable>>;

export interface CommandOptions extends AkairoModuleOptions {
  aliases?: string[];
  args?: ArgumentOptions[] | ArgumentGenerator;
  quoted?: boolean;
  separator?: string;
  flags?: string[];
  optionFlags?: string[];
  channel?: "guild" | "dm";
  ownerOnly?: boolean;
  typing?: boolean;
  editable?: boolean;
  cooldown?: number;
  ratelimit?: number;
  prefix?: OrArray<string> | PrefixSupplier;
  userPermissions?: Permissions;
  clientPermissions?: Permissions;
  regex?: RegExp | UsesContext<RegExp>;
  condition?: ExecutionPredicate;
  before?: UsesContext<boolean>;
  lock?: "guild" | "channel" | "user" | KeySupplier;
  ignoreCooldown?: OrArray<string> | IngoreCheckPredicate;
  ignorePermissions?: OrArray<string> | IngoreCheckPredicate;
  argumentDefaults?: DefaultArgumentOptions;
  description?: CommandDescription;
}

export interface Command extends AkairoModule {
  aliases: string[];
  channel: "dm" | "guild";
  ownerOnly: boolean;
  editable: boolean;
  typing: boolean;
  cooldown: number;
  ratelimit: number;
  argumentDefaults: DefaultArgumentOptions;
  description: CommandDescription;
  prefix: OrArray<string> | PrefixSupplier;
  clientPermissions: Permissions;
  userPermissions: Permissions;
  regex: RegExp | UsesContext<RegExp>;
  lock: KeySupplier;
  ignoreCooldown: OrArray<string> | IngoreCheckPredicate;
  ignorePermissions: OrArray<string> | IngoreCheckPredicate;
  constructor(id: string, options?: CommandOptions): Command;
  before(ctx: CommandContext): OrPromise<boolean>;
  condition(ctx: CommandContext): boolean;
  exec(ctx: CommandContext, args?: Record<string, any>): Promise<any>;
}

export class Command extends AkairoModule {
  #contentParser: ContentParser;
  #argumentRunner: ArgumentRunner = new ArgumentRunner(this);
  #argumentGenerator: ArgumentGenerator;
  public handler: CommandHandler;

  public aliases: string[];
  public channel: "dm" | "guild";
  public ownerOnly: boolean;
  public editable: boolean;
  public typing: boolean;
  public cooldown: number;
  public ratelimit: number;
  public argumentDefaults: DefaultArgumentOptions;
  public description: CommandDescription;
  public prefix: OrArray<string> | PrefixSupplier;
  public clientPermissions: Permissions;
  public userPermissions: Permissions;
  public regex: RegExp | UsesContext<RegExp>;
  public condition: ExecutionPredicate;
  public before: UsesContext<boolean>;
  public lock: KeySupplier;
  public locker: Set<string>;
  public ignoreCooldown: OrArray<string> | IngoreCheckPredicate;
  public ignorePermissions: OrArray<string> | IngoreCheckPredicate;

  public constructor(id: string, options: CommandOptions = {}) {
    super(id, { category: options.category });

    const {
      aliases = [],
      args = [],
      quoted = true,
      separator,
      channel = null,
      ownerOnly = false,
      editable = true,
      typing = false,
      cooldown = null,
      ratelimit = 1,
      argumentDefaults = {},
      description = { content: "", examples: [], usage: "" },
      prefix = this.prefix,
      clientPermissions = this.clientPermissions,
      userPermissions = this.userPermissions,
      regex = this.regex,
      condition = this.condition || (() => false),
      before = this.before || (() => undefined),
      lock,
      ignoreCooldown,
      ignorePermissions,
      flags = [],
      optionFlags = [],
    } = options;

    const { flagWords, optionFlagWords } = Array.isArray(args)
      ? ContentParser.getFlags(args)
      : { flagWords: flags, optionFlagWords: optionFlags };

    this.#contentParser = new ContentParser({
      flagWords,
      optionFlagWords,
      quoted,
      separator,
    });

    //@ts-ignore
    this.#argumentGenerator = Array.isArray(args)
      ? ArgumentRunner.fromArguments(
          args.map((arg) => [arg.id, new Argument(this, arg)])
        )
      : args.bind(this);

    this.aliases = aliases;
    this.channel = channel;
    this.ownerOnly = Boolean(ownerOnly);
    this.editable = Boolean(editable);
    this.typing = Boolean(typing);
    this.cooldown = cooldown;
    this.ratelimit = ratelimit;
    this.argumentDefaults = argumentDefaults;
    this.description = description;
    this.prefix = typeof prefix === "function" ? prefix.bind(this) : prefix;
    this.clientPermissions =
      typeof clientPermissions === "function"
        ? clientPermissions.bind(this)
        : clientPermissions;
    this.userPermissions =
      typeof userPermissions === "function"
        ? userPermissions.bind(this)
        : userPermissions;
    this.regex = typeof regex === "function" ? regex.bind(this) : regex;
    this.condition = condition.bind(this);
    this.before = before.bind(this);

    this.lock = lock as KeySupplier;
    if (typeof lock === "string") {
      this.lock = ({
        guild: (ctx) => ctx.guild && ctx.guild.id,
        channel: (ctx) => ctx.channel.id,
        user: (ctx) => ctx.author.id,
      } as Record<string, KeySupplier>)[lock];
    }

    if (this.lock) {
      this.locker = new Set();
    }

    this.ignoreCooldown =
      typeof ignoreCooldown === "function"
        ? ignoreCooldown.bind(this)
        : ignoreCooldown;

    this.ignorePermissions =
      typeof ignorePermissions === "function"
        ? ignorePermissions.bind(this)
        : ignorePermissions;
  }

  public async exec(
    ctx: CommandContext,
    args?: Record<string, any>
  ): Promise<any> {
    throw new AkairoError("NOT_IMPLEMENTED", this.constructor.name, "exec");
  }

  public parse(message: Message, content: string): Promise<any> {
    const parsed = this.#contentParser.parse(content);
    return this.#argumentRunner.run(message, parsed, this.#argumentGenerator);
  }
}
