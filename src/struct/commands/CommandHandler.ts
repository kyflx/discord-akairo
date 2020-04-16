import { Channel, Collection, Message, TextChannel, User } from "discord.js";
import {
  AkairoError,
  BuiltInReasons,
  CommandHandlerEvents,
  OrArray,
  OrPromise,
  Util,
} from "../../util";
import { AkairoClient } from "../AkairoClient";
import { AkairoHandler, AkairoHandlerOptions } from "../AkairoHandler";
import { InhibitorHandler } from "../inhibitors/InhibitorHandler";
import { ListenerHandler } from "../listeners/ListenerHandler";
import { DefaultArgumentOptions } from "./arguments/Argument";
import { TypeResolver } from "./arguments/TypeResolver";
import { Command } from "./Command";
import { CommandContext, UsesContext } from "./CommandContext";
import { CommandUtil } from "./CommandUtil";
import { Flag } from "./Flag";

export type PrefixSupplier = (
  ctx: CommandContext
) => OrPromise<OrArray<string>>;

export interface ParsedComponentData {
  afterPrefix?: string;
  alias?: string;
  command?: Command;
  content?: string;
  prefix?: string;
}

export interface CooldownData {
  end?: number;
  timer?: NodeJS.Timer;
  uses?: number;
}

export interface CommandHandlerOptions extends AkairoHandlerOptions {
  aliasReplacement?: RegExp;
  allowMention?: boolean | UsesContext<boolean>;
  argumentDefaults?: DefaultArgumentOptions;
  blockBots?: boolean;
  blockClient?: boolean;
  commandUtil?: boolean;
  commandUtilLifetime?: number;
  commandUtilSweepInterval?: number;
  defaultCooldown?: number;
  fetchMembers?: boolean;
  handleEdits?: boolean;
  ignoreCooldown?: OrArray<string> | UsesContext<OrArray<string>>;
  ignorePermissions?: OrArray<string> | UsesContext<OrArray<string>>;
  prefix?: OrArray<string> | PrefixSupplier;
  storeMessages?: boolean;
}

/**
 * Loads commands and handles messages.
 * @param {AkairoClient} client - The Akairo client.
 * @param {CommandHandlerOptions} options - Options.
 * @extends {AkairoHandler}
 */
export class CommandHandler extends AkairoHandler<Command> {
  public resolver: TypeResolver = new TypeResolver(this);
  public aliases: Collection<string, string> = new Collection();
  public prefixes: Collection<
    string | PrefixSupplier,
    Set<string>
  > = new Collection();
  public commandUtils: Collection<string, CommandUtil> = new Collection();
  public prompts: Collection<string, Set<string>> = new Collection();
  public inhibitorHandler?: InhibitorHandler;
  public cooldowns: Collection<
    string,
    Record<string, CooldownData>
  > = new Collection();

  public aliasReplacement: RegExp;
  public blockClient: boolean;
  public blockBots: boolean;
  public fetchMembers: boolean;
  public handleEdits: boolean;
  public storeMessages: boolean;
  public commandUtil: boolean;
  public commandUtilLifetime: number;
  public commandUtilSweepInterval: number;
  public defaultCooldown: number;
  public ignoreCooldown: OrArray<string> | UsesContext<OrArray<string>>;
  public ignorePermissions: OrArray<string> | UsesContext<OrArray<string>>;
  public argumentDefaults: DefaultArgumentOptions;
  public prefix: OrArray<string> | PrefixSupplier;
  public allowMention: boolean | UsesContext<boolean>;

  public constructor(
    client: AkairoClient,
    {
      directory,
      classToHandle = Command,
      extensions = [".js", ".ts"],
      automateCategories,
      loadFilter,
      blockClient = true,
      blockBots = true,
      fetchMembers = false,
      handleEdits = false,
      storeMessages = false,
      commandUtil,
      commandUtilLifetime = 3e5,
      commandUtilSweepInterval = 3e5,
      defaultCooldown = 0,
      ignoreCooldown = client.ownerID,
      ignorePermissions = [],
      argumentDefaults = {},
      prefix = "!",
      allowMention = true,
      aliasReplacement,
    }: CommandHandlerOptions = {}
  ) {
    super(client, {
      directory,
      classToHandle,
      extensions,
      automateCategories,
      loadFilter,
    });

    this.aliasReplacement = aliasReplacement;

    this.blockClient = Boolean(blockClient);

    this.blockBots = Boolean(blockBots);

    this.fetchMembers = Boolean(fetchMembers);

    this.handleEdits = Boolean(handleEdits);

    /**
     * Whether or not to store messages in CommandUtil.
     * @type {boolean}
     */
    this.storeMessages = Boolean(storeMessages);

    this.commandUtil = Boolean(commandUtil);
    if ((this.handleEdits || this.storeMessages) && !this.commandUtil) {
      throw new AkairoError("COMMAND_UTIL_EXPLICIT");
    }

    this.commandUtilLifetime = commandUtilLifetime;

    this.commandUtilSweepInterval = commandUtilSweepInterval;
    if (this.commandUtilSweepInterval > 0) {
      this.client.setInterval(
        () => this.sweepCommandUtil(),
        this.commandUtilSweepInterval
      );
    }

    this.commandUtils = new Collection();

    this.defaultCooldown = defaultCooldown;

    this.ignoreCooldown =
      typeof ignoreCooldown === "function"
        ? ignoreCooldown.bind(this)
        : ignoreCooldown;

    this.ignorePermissions =
      typeof ignorePermissions === "function"
        ? ignorePermissions.bind(this)
        : ignorePermissions;

    this.argumentDefaults = Util.deepAssign(
      {
        prompt: {
          start: "",
          retry: "",
          timeout: "",
          ended: "",
          cancel: "",
          retries: 1,
          time: 30000,
          cancelWord: "cancel",
          stopWord: "stop",
          optional: false,
          infinite: false,
          limit: Infinity,
          breakout: true,
        },
      },
      argumentDefaults
    );

    this.prefix = typeof prefix === "function" ? prefix.bind(this) : prefix;

    this.allowMention =
      typeof allowMention === "function"
        ? allowMention.bind(this)
        : Boolean(allowMention);

    this.setup();
  }

  public setup() {
    this.client.once("ready", () => {
      this.client.on("message", async (m) => {
        if (m.partial) await m.fetch();
        this.handle(m);
      });

      if (this.handleEdits) {
        this.client.on("messageUpdate", async (o, m) => {
          if (o.partial) await o.fetch();
          if (m.partial) await m.fetch();
          if (o.content === m.content) return;
          if (this.handleEdits) this.handle(m as Message);
        });
      }
    });
  }

  public register(command: Command, filepath?: string): void {
    super.register(command, filepath);

    for (let alias of command.aliases) {
      const conflict = this.aliases.get(alias.toLowerCase());
      if (conflict)
        throw new AkairoError("ALIAS_CONFLICT", alias, command.id, conflict);

      alias = alias.toLowerCase();
      this.aliases.set(alias, command.id);
      if (this.aliasReplacement) {
        const replacement = alias.replace(this.aliasReplacement, "");

        if (replacement !== alias) {
          const replacementConflict = this.aliases.get(replacement);
          if (replacementConflict)
            throw new AkairoError(
              "ALIAS_CONFLICT",
              replacement,
              command.id,
              replacementConflict
            );
          this.aliases.set(replacement, command.id);
        }
      }
    }

    if (command.prefix != null) {
      let newEntry = false;

      if (Array.isArray(command.prefix)) {
        for (const prefix of command.prefix) {
          const prefixes = this.prefixes.get(prefix);
          if (prefixes) {
            prefixes.add(command.id);
          } else {
            this.prefixes.set(prefix, new Set([command.id]));
            newEntry = true;
          }
        }
      } else {
        const prefixes = this.prefixes.get(command.prefix);
        if (prefixes) {
          prefixes.add(command.id);
        } else {
          this.prefixes.set(command.prefix, new Set([command.id]));
          newEntry = true;
        }
      }

      if (newEntry) {
        this.prefixes = this.prefixes.sort((aVal, bVal, aKey, bKey) =>
          Util.prefixCompare(aKey, bKey)
        );
      }
    }
  }

  /**
   * Deregisters a module.
   * @param {Command} command - Module to use.
   * @returns {void}
   */
  public deregister(command: Command): void {
    for (let alias of command.aliases) {
      alias = alias.toLowerCase();
      this.aliases.delete(alias);

      if (this.aliasReplacement) {
        const replacement = alias.replace(this.aliasReplacement, "");
        if (replacement !== alias) this.aliases.delete(replacement);
      }
    }

    if (command.prefix != null) {
      if (Array.isArray(command.prefix)) {
        for (const prefix of command.prefix) {
          const prefixes = this.prefixes.get(prefix);
          if (prefixes.size === 1) {
            this.prefixes.delete(prefix);
          } else {
            prefixes.delete(prefix);
          }
        }
      } else {
        const prefixes = this.prefixes.get(command.prefix);
        if (prefixes.size === 1) {
          this.prefixes.delete(command.prefix);
        } else {
          prefixes.delete(command.prefix as string);
        }
      }
    }

    super.deregister(command);
  }

  public async handle(message: Message): Promise<void | boolean> {
    try {
      if (
        this.fetchMembers &&
        message.guild &&
        !message.member &&
        !message.webhookID
      ) {
        await message.guild.members.fetch(message.author);
      }

      if (await this.runAllTypeInhibitors(message)) {
        return false;
      }

      if (this.commandUtil) {
        if (this.commandUtils.has(message.id)) {
          message.util = this.commandUtils.get(message.id);
        } else {
          message.util = new CommandUtil(this, message);
          this.commandUtils.set(message.id, message.util);
        }
      }

      if (await this.runPreTypeInhibitors(message)) {
        return false;
      }

      let parsed = await this.parseCommand(message);
      if (!parsed.command) {
        const overParsed = await this.parseCommandOverwrittenPrefixes(message);
        if (
          overParsed.command ||
          (parsed.prefix == null && overParsed.prefix != null)
        ) {
          parsed = overParsed;
        }
      }

      if (this.commandUtil) {
        message.util.parsed = parsed;
      }

      let ran;
      if (!parsed.command) {
        ran = await this.handleRegexAndConditionalCommands(message);
      } else {
        ran = await this.handleDirectCommand(
          message,
          parsed.content,
          parsed.command
        );
      }

      if (ran === false) {
        this.emit(CommandHandlerEvents.MESSAGE_INVALID, message.util.context);
        return false;
      }

      return ran;
    } catch (err) {
      this.emitError(err, message);
      return null;
    }
  }

  /**
   * Handles normal commands.
   * @param {Message} message - Message to handle.
   * @param {string} content - Content of message without command.
   * @param {Command} command - Command instance.
   * @param {boolean} [ignore=false] - Ignore inhibitors and other checks.
   * @returns {Promise<?boolean>}
   */
  async handleDirectCommand(
    message: Message,
    content: string,
    command: Command,
    ignore = false
  ): Promise<void | boolean> {
    let key;
    try {
      if (!ignore) {
        if (message.edited && !command.editable) return false;
        if (await this.runPostTypeInhibitors(message, command)) return false;
      }

      const before = command.before(message.util.context);
      if (Util.isPromise(before)) await before;

      const args = await command.parse(message, content);
      if (Flag.is(args, "cancel")) {
        this.emit(
          CommandHandlerEvents.COMMAND_CANCELLED,
          message.util.context,
          command
        );
        return true;
      } else if (Flag.is(args, "retry")) {
        this.emit(
          CommandHandlerEvents.COMMAND_BREAKOUT,
          message.util.context,
          command,
          args.message
        );
        return this.handle(args.message);
      } else if (Flag.is(args, "continue")) {
        const continueCommand = this.modules.get(args.command);
        return this.handleDirectCommand(
          message,
          args.rest,
          continueCommand,
          args.ignore
        );
      }

      if (!ignore) {
        if (command.lock) key = command.lock(message.util.context, args);
        if (Util.isPromise(key)) key = await key;
        if (key) {
          if (command.locker.has(key)) {
            key = null;
            this.emit(
              CommandHandlerEvents.COMMAND_LOCKED,
              message.util.context,
              command
            );
            return true;
          }

          command.locker.add(key);
        }
      }

      return await this.runCommand(message, command, args);
    } catch (err) {
      this.emitError(err, message, command);
      return null;
    } finally {
      if (key) command.locker.delete(key);
    }
  }

  public async handleRegexAndConditionalCommands(
    message: Message
  ): Promise<boolean> {
    const ran1 = await this.handleRegexCommands(message);
    const ran2 = await this.handleConditionalCommands(message);
    return ran1 || ran2;
  }

  public async handleRegexCommands(message: Message): Promise<boolean> {
    const hasRegexCommands: { command: Command; regex: RegExp }[] = [];
    for (const command of this.modules.values()) {
      if (message.edited ? command.editable : true) {
        const regex =
          typeof command.regex === "function"
            ? await command.regex(message.util.context)
            : command.regex;
        if (regex) hasRegexCommands.push({ command, regex });
      }
    }

    const matchedCommands = [];
    for (const entry of hasRegexCommands) {
      const match = message.content.match(entry.regex);
      if (!match) continue;

      const matches = [];

      if (entry.regex.global) {
        let matched;

        while ((matched = entry.regex.exec(message.content)) != null) {
          matches.push(matched);
        }
      }

      matchedCommands.push({ command: entry.command, match, matches });
    }

    if (!matchedCommands.length) {
      return false;
    }

    const promises = [];
    for (const { command, match, matches } of matchedCommands) {
      promises.push(
        (async () => {
          try {
            if (await this.runPostTypeInhibitors(message, command)) return;
            const before = command.before(message.util.context);
            if (Util.isPromise(before)) await before;
            await this.runCommand(message, command, { match, matches });
          } catch (err) {
            this.emitError(err, message, command);
          }
        })()
      );
    }

    await Promise.all(promises);
    return true;
  }

  public async handleConditionalCommands(message: Message): Promise<boolean> {
    const trueCommands = this.modules.filter(
      (command) =>
        (message.edited ? command.editable : true) &&
        command.condition(message.util.context)
    );

    if (!trueCommands.size) {
      return false;
    }

    const promises = [];
    for (const command of trueCommands.values()) {
      promises.push(
        (async () => {
          try {
            if (await this.runPostTypeInhibitors(message, command)) return;
            const before = command.before(message.util.context);
            if (Util.isPromise(before)) await before;
            await this.runCommand(message, command, {});
          } catch (err) {
            this.emitError(err, message, command);
          }
        })()
      );
    }

    await Promise.all(promises);
    return true;
  }

  public async runAllTypeInhibitors(message: Message) {
    const reason = this.inhibitorHandler
      ? await this.inhibitorHandler.test("all", message)
      : null;

    if (reason != null) {
      this.emit(CommandHandlerEvents.MESSAGE_BLOCKED, message, reason);
    } else if (this.blockClient && message.author.id === this.client.user.id) {
      this.emit(
        CommandHandlerEvents.MESSAGE_BLOCKED,
        message,
        BuiltInReasons.CLIENT
      );
    } else if (this.blockBots && message.author.bot) {
      this.emit(
        CommandHandlerEvents.MESSAGE_BLOCKED,
        message,
        BuiltInReasons.BOT
      );
    } else if (this.hasPrompt(message.channel, message.author)) {
      this.emit(CommandHandlerEvents.IN_PROMPT, message);
    } else {
      return false;
    }

    return true;
  }

  public async runPreTypeInhibitors(message: Message): Promise<boolean> {
    const reason = this.inhibitorHandler
      ? await this.inhibitorHandler.test("pre", message)
      : null;

    if (reason != null) {
      this.emit(CommandHandlerEvents.MESSAGE_BLOCKED, message, reason);
    } else {
      return false;
    }

    return true;
  }

  public async runPostTypeInhibitors(
    message: Message,
    command: Command
  ): Promise<boolean> {
    if (command.ownerOnly) {
      const isOwner = this.client.isOwner(message.author);
      if (!isOwner) {
        this.emit(
          CommandHandlerEvents.COMMAND_BLOCKED,
          message,
          command,
          BuiltInReasons.OWNER
        );
        return true;
      }
    }

    if (command.channel === "guild" && !message.guild) {
      this.emit(
        CommandHandlerEvents.COMMAND_BLOCKED,
        message,
        command,
        BuiltInReasons.GUILD
      );
      return true;
    }

    if (command.channel === "dm" && message.guild) {
      this.emit(
        CommandHandlerEvents.COMMAND_BLOCKED,
        message,
        command,
        BuiltInReasons.DM
      );
      return true;
    }

    if (await this.runPermissionChecks(message, command)) {
      return true;
    }

    const reason = this.inhibitorHandler
      ? await this.inhibitorHandler.test("post", message, command)
      : null;

    if (reason != null) {
      this.emit(CommandHandlerEvents.COMMAND_BLOCKED, message, command, reason);
      return true;
    }

    if (this.runCooldowns(message, command)) {
      return true;
    }

    return false;
  }

  /**
   * Runs permission checks.
   * @param {Message} message - Message that called the command.
   * @param {Command} command - Command to cooldown.
   * @returns {Promise<boolean>}
   */
  public async runPermissionChecks(
    message: Message,
    command: Command
  ): Promise<boolean> {
    if (command.clientPermissions) {
      if (typeof command.clientPermissions === "function") {
        let missing = command.clientPermissions(message.util.context);
        if (Util.isPromise(missing)) missing = await missing;

        if (missing != null) {
          this.emit(
            CommandHandlerEvents.MISSING_PERMISSIONS,
            message,
            command,
            "client",
            missing
          );
          return true;
        }
      } else if (message.guild) {
        const missing = (message.channel as TextChannel)
          .permissionsFor(this.client.user)
          .missing(command.clientPermissions);
        if (missing.length) {
          this.emit(
            CommandHandlerEvents.MISSING_PERMISSIONS,
            message,
            command,
            "client",
            missing
          );
          return true;
        }
      }
    }

    if (command.userPermissions) {
      const ignorer = command.ignorePermissions || this.ignorePermissions;
      const isIgnored = Array.isArray(ignorer)
        ? ignorer.includes(message.author.id)
        : typeof ignorer === "function"
        ? ignorer(message.util.context, command)
        : message.author.id === ignorer;

      if (!isIgnored) {
        if (typeof command.userPermissions === "function") {
          let missing = command.userPermissions(message.util.context);
          if (Util.isPromise(missing)) missing = await missing;

          if (missing != null) {
            this.emit(
              CommandHandlerEvents.MISSING_PERMISSIONS,
              message,
              command,
              "user",
              missing
            );
            return true;
          }
        } else if (message.guild) {
          const missing = (message.channel as TextChannel)
            .permissionsFor(message.author)
            .missing(command.userPermissions);
          if (missing.length) {
            this.emit(
              CommandHandlerEvents.MISSING_PERMISSIONS,
              message,
              command,
              "user",
              missing
            );
            return true;
          }
        }
      }
    }

    return false;
  }

  public runCooldowns(message: Message, command: Command): boolean {
    const ignorer = command.ignoreCooldown || this.ignoreCooldown;
    const isIgnored = Array.isArray(ignorer)
      ? ignorer.includes(message.author.id)
      : typeof ignorer === "function"
      ? ignorer(message.util.context, command)
      : message.author.id === ignorer;

    if (isIgnored) return false;

    const time =
      command.cooldown != null ? command.cooldown : this.defaultCooldown;
    if (!time) return false;

    const endTime = message.createdTimestamp + time;

    const id = message.author.id;
    if (!this.cooldowns.has(id)) this.cooldowns.set(id, {});

    if (!this.cooldowns.get(id)[command.id]) {
      this.cooldowns.get(id)[command.id] = {
        timer: this.client.setTimeout(() => {
          this.client.clearTimeout(this.cooldowns.get(id)[command.id].timer);
          this.cooldowns.get(id)[command.id] = null;

          if (!Object.keys(this.cooldowns.get(id)).length) {
            this.cooldowns.delete(id);
          }
        }, time),
        end: endTime,
        uses: 0,
      };
    }

    const entry = this.cooldowns.get(id)[command.id];

    if (entry.uses >= command.ratelimit) {
      const end = this.cooldowns.get(message.author.id)[command.id].end;
      const diff = end - message.createdTimestamp;

      this.emit(CommandHandlerEvents.COOLDOWN, message, command, diff);
      return true;
    }

    entry.uses++;
    return false;
  }

  /**
   * Runs a command.
   * @param {Message} message - Message to handle.
   * @param {Command} command - Command to handle.
   * @param {any} args - Arguments to use.
   * @returns {Promise<void>}
   */
  async runCommand(
    message: Message,
    command: Command,
    args: Record<string, any>
  ) {
    if (command.typing) {
      message.channel.startTyping();
    }

    try {
      this.emit(CommandHandlerEvents.COMMAND_STARTED, message, command, args);
      const ret = await command.exec(message.util.context, args);
      this.emit(
        CommandHandlerEvents.COMMAND_FINISHED,
        message,
        command,
        args,
        ret
      );
    } finally {
      if (command.typing) {
        message.channel.stopTyping();
      }
    }
  }

  public async parseCommand(message: Message): Promise<ParsedComponentData> {
    let prefixes: string[] = Util.intoArray(
      await Util.intoCallable(this.prefix)(message.util.context)
    );
    const allowMention = await Util.intoCallable(this.prefix)(
      message.util.context
    );
    if (allowMention) {
      const mentions = [
        `<@${this.client.user.id}>`,
        `<@!${this.client.user.id}>`,
      ];
      prefixes = [...mentions, ...prefixes];
    }

    prefixes.sort(Util.prefixCompare);
    return this.parseMultiplePrefixes(
      message,
      prefixes.map((p) => [p, null])
    );
  }

  /**
   * Parses the command and its argument list using prefix overwrites.
   * @param {Message} message - Message that called the command.
   * @returns {Promise<ParsedComponentData>}
   */
  public async parseCommandOverwrittenPrefixes(
    message: Message
  ): Promise<ParsedComponentData> {
    if (!this.prefixes.size) {
      return {};
    }

    const promises = this.prefixes.map(async (cmds, provider) => {
      const prefixes = Util.intoArray(
        await Util.intoCallable(provider)(message.util.context)
      );
      return prefixes.map((p) => [p, cmds]);
    });

    const pairs = Util.flatMap(await Promise.all(promises), (x: any) => x);
    pairs.sort(([a], [b]) => Util.prefixCompare(a, b));
    return this.parseMultiplePrefixes(message, pairs);
  }

  public parseMultiplePrefixes(
    message: Message,
    pairs: [string, Set<string> | null][]
  ): ParsedComponentData {
    const parses = pairs.map(([prefix, cmds]) =>
      this.parseWithPrefix(message, prefix, cmds)
    );
    const result = parses.find((parsed) => parsed.command);
    if (result) {
      return result;
    }

    const guess = parses.find((parsed) => parsed.prefix != null);
    if (guess) {
      return guess;
    }

    return {};
  }

  public parseWithPrefix(
    message: Message,
    prefix: string,
    associatedCommands: Set<string> = null
  ): ParsedComponentData {
    const lowerContent = message.content.toLowerCase();
    if (!lowerContent.startsWith(prefix.toLowerCase())) {
      return {};
    }

    const endOfPrefix =
      lowerContent.indexOf(prefix.toLowerCase()) + prefix.length;
    const startOfArgs =
      message.content.slice(endOfPrefix).search(/\S/) + prefix.length;
    const alias = message.content.slice(startOfArgs).split(/\s{1,}|\n{1,}/)[0];
    const command = this.findCommand(alias);
    const content = message.content
      .slice(startOfArgs + alias.length + 1)
      .trim();
    const afterPrefix = message.content.slice(prefix.length).trim();

    if (!command) {
      return { prefix, alias, content, afterPrefix };
    }

    if (associatedCommands == null) {
      if (command.prefix != null) {
        return { prefix, alias, content, afterPrefix };
      }
    } else if (!associatedCommands.has(command.id)) {
      return { prefix, alias, content, afterPrefix };
    }

    return { command, prefix, alias, content, afterPrefix };
  }

  public emitError(err: Error, message: Message, command?: Command): void {
    if (command && command.typing) message.channel.stopTyping();
    if (this.listenerCount(CommandHandlerEvents.ERROR)) {
      this.emit(CommandHandlerEvents.ERROR, err, message.util.context, command);
      return;
    }

    throw err;
  }

  /**
   * Sweep command util instances from cache and returns amount sweeped.
   */
  public sweepCommandUtil(lifetime: number = this.commandUtilLifetime): number {
    let count = 0;
    for (const commandUtil of this.commandUtils.values()) {
      const now = Date.now();
      const message = commandUtil.message;
      if (
        now - (message.editedTimestamp || message.createdTimestamp) >
        lifetime
      ) {
        count++;
        this.commandUtils.delete(message.id);
      }
    }

    return count;
  }

  public addPrompt(channel: Channel, user: User): void {
    let users = this.prompts.get(channel.id);
    if (!users) this.prompts.set(channel.id, new Set());
    users = this.prompts.get(channel.id);
    users.add(user.id);
  }

  public removePrompt(channel: Channel, user: User): void {
    const users = this.prompts.get(channel.id);
    if (!users) return;
    users.delete(user.id);
    if (!users.size) this.prompts.delete(user.id);
  }

  public hasPrompt(channel: Channel, user: User): boolean {
    const users = this.prompts.get(channel.id);
    if (!users) return false;
    return users.has(user.id);
  }

  public findCommand(name: string): Command {
    return this.modules.get(this.aliases.get(name.toLowerCase()));
  }

  public useInhibitorHandler(
    inhibitorHandler: InhibitorHandler
  ): CommandHandler {
    this.inhibitorHandler = inhibitorHandler;
    this.resolver.inhibitorHandler = inhibitorHandler;

    return this;
  }

  public useListenerHandler(listenerHandler: ListenerHandler): CommandHandler {
    this.resolver.listenerHandler = listenerHandler;

    return this;
  }
}
