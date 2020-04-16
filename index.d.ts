declare module "@kyflx-dev/akairo" {
  import { BufferResolvable, Channel, Client, ClientOptions, Collection, DMChannel, Emoji, Guild, GuildMember, Message, MessageAdditions, MessageAttachment, MessageEditOptions, MessageEmbed, MessageOptions, PermissionResolvable, Role, Snowflake, StringResolvable, TextChannel, User, UserResolvable, VoiceChannel, VoiceState } from "discord.js";
  import { EventEmitter } from "events";
  import { Database } from "sqlite";
  import { Stream } from "stream";

  export declare class SQLiteProvider<T extends any> extends Provider<T> {
    #private;
    tableName: string;
    idColumn: string;
    dataColumn: string;
    constructor(
      db: Database | Promise<Database>,
      tableName: string,
      { idColumn, dataColumn }?: SQLProviderOptions
    );
    init(): Promise<void>;
    get<V>(id: string, key: string, defaultValue: V): V;
    set(
      id: string,
      key: string,
      value: any
    ): Promise<import("sqlite").ISqlite.RunResult<import("sqlite3").Statement>>;
    delete(
      id: string,
      key: string
    ): Promise<import("sqlite").ISqlite.RunResult<import("sqlite3").Statement>>;
    clear(
      id: string
    ): Promise<import("sqlite").ISqlite.RunResult<import("sqlite3").Statement>>;
  }

  export interface ArgumentOptions {
    id?: string;
    match?: ArgumentMatch;
    flag?: string | string[];
    type?: ArgumentType | ArgumentTypeCaster;
    multipleFlags?: boolean;
    index?: number;
    unordered?: boolean | number | number[];
    limit?: number;
    default?: any | Supplier<FailureData, any>;
    otherwise?: Content | Supplier<FailureData, Content>;
    modifyOtherwise?: Modifier<FailureData, Content>;
    prompt?: ArgumentPromptOptions;
  }
  export interface ArgumentPromptData {
    retries: number;
    infinite: boolean;
    message: Message;
    phrase: string;
    failure: void | Flag;
  }
  export interface ArgumentPromptOptions {
    retries?: number;
    time?: number;
    cancelWord?: string;
    optional?: boolean;
    infinite?: boolean;
    limit?: number;
    breakout?: boolean;
    start?: Content | Supplier<ArgumentPromptData, Content>;
    retry?: Content | Supplier<ArgumentPromptData, Content>;
    timeout?: Content | Supplier<ArgumentPromptData, Content>;
    ended?: Content | Supplier<ArgumentPromptData, Content>;
    cancel?: Content | Supplier<ArgumentPromptData, Content>;
    stopWord?: string;
    modifyStart?: Modifier<ArgumentPromptData, Content>;
    modifyRetry?: Modifier<ArgumentPromptData, Content>;
    modifyTimeout?: Modifier<ArgumentPromptData, Content>;
    modifyEnded?: Modifier<ArgumentPromptData, Content>;
    modifyCancel?: Modifier<ArgumentPromptData, Content>;
  }
  export declare type InhibitorType = "all" | "pre" | "post";
  export interface InhibitorOptions extends AkairoModuleOptions {
    reason?: string;
    type?: InhibitorType;
    priority?: number;
  }
  export declare class Inhibitor extends AkairoModule {
    handler: InhibitorHandler;
    reason: string;
    type: InhibitorType;
    priority: number;
    constructor(
      id: string,
      { category, reason, type, priority }?: InhibitorOptions
    );
    /**
     * Checks if message should be blocked.
     * A return value of true will block the message.
     * If returning a Promise, a resolved value of true will block the message.
     */
    exec(message: Message, command?: Command): Promise<boolean> | boolean;
  }

  export interface FailureData {
    phrase: string;
    failure: void | Flag;
  }
  export interface DefaultArgumentOptions {
    prompt?: ArgumentPromptOptions;
    otherwise?: Content | Supplier<FailureData, Content>;
    modifyOtherwise?: Supplier<FailureData, Content>;
  }
  export declare type ArgumentMatch =
    | "phrase"
    | "flag"
    | "option"
    | "rest"
    | "separate"
    | "text"
    | "content"
    | "restContent"
    | "none";
  export declare type ArgumentType =
    | "string"
    | "lowercase"
    | "uppercase"
    | "charCodes"
    | "number"
    | "integer"
    | "bigint"
    | "emojint"
    | "url"
    | "date"
    | "color"
    | "user"
    | "users"
    | "member"
    | "members"
    | "relevant"
    | "relevants"
    | "channel"
    | "channels"
    | "textChannel"
    | "textChannels"
    | "voiceChannel"
    | "voiceChannels"
    | "categoryChannel"
    | "categoryChannels"
    | "newsChannel"
    | "newsChannels"
    | "storeChannel"
    | "storeChannels"
    | "role"
    | "roles"
    | "emoji"
    | "emojis"
    | "guild"
    | "guilds"
    | "message"
    | "guildMessage"
    | "relevantMessage"
    | "invite"
    | "userMention"
    | "memberMention"
    | "channelMention"
    | "roleMention"
    | "emojiMention"
    | "commandAlias"
    | "command"
    | "inhibitor"
    | "listener"
    | (string | string[])[]
    | RegExp
    | string;
  export declare type Content =
    | StringResolvable
    | MessageOptions
    | MessageAdditions;
  export interface SQLProviderOptions {
    idColumn?: string;
    dataColumn?: string;
  }
  export declare abstract class Provider<T> {
    items: Collection<string, T>;
    abstract init(): Promise<any>;
    abstract get(id: string, key: string, defaultValue?: any): any;
    abstract set(id: string, key: string, value: any): any;
    abstract delete(id: string, key: string): any;
    abstract clear(id: string): any;
  }
  export declare class SequelizeProvider<T extends any> extends Provider<T> {
    table: any;
    idColumn: string;
    dataColumn: string;
    constructor(table: any, { idColumn, dataColumn }?: SQLProviderOptions);
    init(): Promise<void>;
    get<V>(id: string, key: string, defaultValue: V): V;
    set(id: string, key: string, value: any): Promise<boolean>;
    delete(id: string, key: string): Promise<boolean>;
    clear(id: string): Promise<boolean>;
  }

  export declare type Modifier<D, T> = (
    ctx?: any,
    text?: Content,
    data?: D
  ) => T | Promise<T>;
  export declare type Supplier<D, T> = (ctx?: any, data?: D) => T | Promise<T>;
  export declare type ArgumentTypeCaster = (ctx?: any, value?: any) => any;
  export declare type ParsedValuePredicate = (
    ctx?: any,
    phrase?: string,
    value?: any
  ) => boolean;
  export declare type ArgumentGenerator = (
    ctx: any,
    parsed: ContentParserResult,
    state: ArgumentRunnerState
  ) => IterableIterator<ArgumentOptions | Flag>;

  export declare class TypeResolver {
    handler: CommandHandler;
    client: AkairoClient;
    types: Collection<string, ArgumentTypeCaster>;
    commandHandler: CommandHandler;
    inhibitorHandler: InhibitorHandler;
    listenerHandler: ListenerHandler;
    constructor(handler: CommandHandler);
    addBuiltInTypes(): void;
    type(name: string): ArgumentTypeCaster;
    addType(name: string, fn: ArgumentTypeCaster): TypeResolver;
    addTypes(types: Record<string, ArgumentTypeCaster>): TypeResolver;
  }

  export interface ArgumentRunnerState {
    usedIndices: Set<number>;
    phraseIndex: number;
    index: number;
  }

  export declare class Argument {
    command: Command;
    match: ArgumentMatch;
    type: ArgumentType | ArgumentTypeCaster;
    flag?: string | string[];
    multipleFlags: boolean;
    index?: number;
    unordered: boolean | number | number[];
    limit: number;
    prompt?: ArgumentPromptOptions;
    default: any | Supplier<FailureData, any>;
    otherwise?: Content | Supplier<FailureData, Content>;
    private modifyOtherwise;
    constructor(
      command: Command,
      {
        match,
        type,
        flag,
        multipleFlags,
        index,
        unordered,
        limit,
        prompt,
        default: defaultValue,
        otherwise,
        modifyOtherwise,
      }?: ArgumentOptions
    );
    get client(): AkairoClient;
    get handler(): CommandHandler;
    process(message: Message, phrase: string): Promise<Flag | any>;
    cast(message: Message, phrase: string): Promise<any>;
    collect(
      message: Message,
      commandInput?: string,
      parsedInput?: any
    ): Promise<Flag | any>;
    static cast(
      type: ArgumentType | ArgumentTypeCaster,
      resolver: TypeResolver,
      message: Message,
      phrase: string
    ): Promise<any>;
    static union(
      ...types: (ArgumentType | ArgumentTypeCaster)[]
    ): ArgumentTypeCaster;
    static product(
      ...types: (ArgumentType | ArgumentTypeCaster)[]
    ): ArgumentTypeCaster;
    static validate(
      type: ArgumentType | ArgumentTypeCaster,
      predicate: ParsedValuePredicate
    ): ArgumentTypeCaster;
    static range(
      type: ArgumentType | ArgumentTypeCaster,
      min: number,
      max: number,
      inclusive?: boolean
    ): ArgumentTypeCaster;
    static compose(
      ...types: (ArgumentType | ArgumentTypeCaster)[]
    ): ArgumentTypeCaster;
    static composeWithFailure(
      ...types: (ArgumentType | ArgumentTypeCaster)[]
    ): ArgumentTypeCaster;
    static withInput(
      type: ArgumentType | ArgumentTypeCaster
    ): ArgumentTypeCaster;
    static tagged(
      type: ArgumentType | ArgumentTypeCaster,
      tag?: string | RegExp | (string | string[])[] | ArgumentTypeCaster
    ): ArgumentTypeCaster;
    static taggedWithInput(
      type: ArgumentType | ArgumentTypeCaster,
      tag?: string | RegExp | (string | string[])[] | ArgumentTypeCaster
    ): ArgumentTypeCaster;
    static taggedUnion(
      ...types: (ArgumentType | ArgumentTypeCaster)[]
    ): ArgumentTypeCaster;
    static isFailure(value: any): boolean;
  }

  declare type Permissions = OrArray<PermissionResolvable> | PermissionSupplier;
  export declare type KeySupplier = (ctx: CommandContext, args?: any) => string;
  export declare type ExecutionPredicate = (ctx: CommandContext) => boolean;
  export declare type IngoreCheckPredicate = (
    ctx: CommandContext,
    command?: Command
  ) => boolean;
  export declare type PermissionSupplier = (
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
    description?: any;
  }

  export declare class Command extends AkairoModule {
    aliases: string[];
    channel: "dm" | "guild";
    ownerOnly: boolean;
    editable: boolean;
    typing: boolean;
    cooldown: number;
    ratelimit: number;
    argumentDefaults: DefaultArgumentOptions;
    description: any;
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
    parse(message: Message, content: string): Promise<any>;
  }

  export declare type UsesContext<T> = (ctx: CommandContext) => T | Promise<T>;
  export declare class CommandContext {
    util: CommandUtil;
    handler: CommandHandler;
    message: Message;
    guild?: Guild;
    member?: GuildMember;
    channel: TextChannel | DMChannel;
    author: User;
    constructor(util: CommandUtil);
    _fix(message: Message): void;
    get voiceState(): VoiceState;
    get vc(): VoiceChannel;
  }

  export declare type PrefixSupplier = (
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

  export declare class CommandHandler extends AkairoHandler<Command> {
    resolver: TypeResolver;
    aliases: Collection<string, string>;
    prefixes: Collection<string | PrefixSupplier, Set<string>>;
    commandUtils: Collection<string, CommandUtil>;
    prompts: Collection<string, Set<string>>;
    inhibitorHandler?: InhibitorHandler;
    cooldowns: Collection<string, Record<string, CooldownData>>;
    aliasReplacement: RegExp;
    blockClient: boolean;
    blockBots: boolean;
    fetchMembers: boolean;
    handleEdits: boolean;
    storeMessages: boolean;
    commandUtil: boolean;
    commandUtilLifetime: number;
    commandUtilSweepInterval: number;
    defaultCooldown: number;
    ignoreCooldown: OrArray<string> | UsesContext<OrArray<string>>;
    ignorePermissions: OrArray<string> | UsesContext<OrArray<string>>;
    argumentDefaults: DefaultArgumentOptions;
    prefix: OrArray<string> | PrefixSupplier;
    allowMention: boolean | UsesContext<boolean>;
    constructor(client: AkairoClient, options?: CommandHandlerOptions);
    setup(): void;
    register(command: Command, filepath?: string): void;
    deregister(command: Command): void;
    handle(message: Message): Promise<void | boolean>;
    handleDirectCommand(
      message: Message,
      content: string,
      command: Command,
      ignore?: boolean
    ): Promise<void | boolean>;
    handleRegexAndConditionalCommands(message: Message): Promise<boolean>;
    handleRegexCommands(message: Message): Promise<boolean>;
    handleConditionalCommands(message: Message): Promise<boolean>;
    runAllTypeInhibitors(message: Message): Promise<boolean>;
    runPreTypeInhibitors(message: Message): Promise<boolean>;
    runPostTypeInhibitors(message: Message, command: Command): Promise<boolean>;
    runPermissionChecks(message: Message, command: Command): Promise<boolean>;
    runCooldowns(message: Message, command: Command): boolean;
    runCommand(
      message: Message,
      command: Command,
      args: Record<string, any>
    ): Promise<void>;
    parseCommand(message: Message): Promise<ParsedComponentData>;
    parseCommandOverwrittenPrefixes(
      message: Message
    ): Promise<ParsedComponentData>;
    parseMultiplePrefixes(
      message: Message,
      pairs: [string, Set<string> | null][]
    ): ParsedComponentData;
    parseWithPrefix(
      message: Message,
      prefix: string,
      associatedCommands?: Set<string>
    ): ParsedComponentData;
    emitError(err: Error, message: Message, command?: Command): void;
    sweepCommandUtil(lifetime?: number): number;
    addPrompt(channel: Channel, user: User): void;
    removePrompt(channel: Channel, user: User): void;
    hasPrompt(channel: Channel, user: User): boolean;
    findCommand(name: string): Command;
    useInhibitorHandler(inhibitorHandler: InhibitorHandler): CommandHandler;
    useListenerHandler(listenerHandler: ListenerHandler): CommandHandler;
  }

  export declare type ListenerType = "on" | "once" | "off";
  export interface ListenerOptions extends AkairoModuleOptions {
    emitter: string | EventEmitter;
    event: string;
    type?: ListenerType;
  }
  export declare class Listener extends AkairoModule {
    emitter: string | EventEmitter;
    event: string;
    type: ListenerType;
    handler: ListenerHandler;
    constructor(id: string, options?: ListenerOptions);
    exec(): void;
  }

  export declare type LoadPredicate = (filepath: string) => boolean;
  export interface AkairoHandlerOptions {
    automateCategories?: boolean;
    classToHandle?: Function;
    directory?: string;
    extensions?: string[] | Set<string>;
    loadFilter?: LoadPredicate;
  }
  export declare class AkairoHandler<
    T extends AkairoModule
  > extends EventEmitter {
    client: AkairoClient;
    directory?: string;
    classToHandle: Function;
    extensions: Set<string>;
    automateCategories: boolean;
    loadFilter: LoadPredicate;
    modules: Collection<string, T>;
    categories: Collection<string, Category<T>>;
    constructor(client: AkairoClient, options?: AkairoHandlerOptions);
    register(mod: T, filepath: string): void;
    deregister(mod: T): void;
    load(thing: string | Function, isReload?: boolean): T | undefined;
    loadAll(directory?: string, filter?: LoadPredicate): this;
    remove(id: string): void;
    removeAll(): this;
    reload(id: string): T;
    reloadAll(): this;
    findCategory(name: string): Category<T>;
    static readdirRecursive(directory: string): string[];
  }

  export interface AkairoOptions {
    ownerID?: Snowflake | Snowflake[];
  }
  export declare class AkairoClient extends Client {
    util: ClientUtil;
    ownerID: Snowflake | Snowflake[];
    constructor(options?: AkairoOptions & ClientOptions);
    isOwner(user: UserResolvable): boolean;
  }

  export interface AkairoModuleOptions {
    category?: string;
  }

  export declare abstract class AkairoModule {
    id: string;
    categoryID: string;
    filepath?: string;
    category?: Category<AkairoModule>;
    client: AkairoClient;
    handler: AkairoHandler<AkairoModule>;
    constructor(id: string, options?: AkairoModuleOptions);
    reload(): AkairoModule;
    remove(): void;
    toString(): string;
  }

  export declare class AkairoError extends Error {
    code: string;
    constructor(key: string, ...args: any[]);
    get name(): string;
  }

  export declare class Category<T extends AkairoModule> extends Collection<
    string,
    T
  > {
    id: string;
    constructor(id: string, iterable?: readonly (readonly [string, T])[]);
    reloadAll(): this;
    removeAll(): this;
    toString(): string;
  }

  export declare enum ArgumentMatches {
    PHRASE = "phrase",
    FLAG = "flag",
    OPTION = "option",
    REST = "rest",
    SEPARATE = "separate",
    TEXT = "text",
    CONTENT = "content",
    REST_CONTENT = "restContent",
    NONE = "none",
  }
  export declare enum ArgumentTypes {
    STRING = "string",
    LOWERCASE = "lowercase",
    UPPERCASE = "uppercase",
    CHAR_CODES = "charCodes",
    NUMBER = "number",
    INTEGER = "integer",
    BIGINT = "bigint",
    EMOJINT = "emojint",
    URL = "url",
    DATE = "date",
    COLOR = "color",
    USER = "user",
    USERS = "users",
    MEMBER = "member",
    MEMBERS = "members",
    RELEVANT = "relevant",
    RELEVANTS = "relevants",
    CHANNEL = "channel",
    CHANNELS = "channels",
    TEXT_CHANNEL = "textChannel",
    TEXT_CHANNELS = "textChannels",
    VOICE_CHANNEL = "voiceChannel",
    VOICE_CHANNELS = "voiceChannels",
    CATEGORY_CHANNEL = "categoryChannel",
    CATEGORY_CHANNELS = "categoryChannels",
    NEWS_CHANNEL = "newsChannel",
    NEWS_CHANNELS = "newsChannels",
    STORE_CHANNEL = "storeChannel",
    STORE_CHANNELS = "storeChannels",
    ROLE = "role",
    ROLES = "roles",
    EMOJI = "emoji",
    EMOJIS = "emojis",
    GUILD = "guild",
    GUILDS = "guilds",
    MESSAGE = "message",
    GUILD_MESSAGE = "guildMessage",
    RELEVANT_MESSAGE = "relevantMessage",
    INVITE = "invite",
    MEMBER_MENTION = "memberMention",
    CHANNEL_MENTION = "channelMention",
    ROLE_MENTION = "roleMention",
    EMOJI_MENTION = "emojiMention",
    COMMAND_ALIAS = "commandAlias",
    COMMAND = "command",
    INHIBITOR = "inhibitor",
    LISTENER = "listener",
  }
  export declare enum AkairoHandlerEvents {
    LOAD = "load",
    REMOVE = "remove",
  }
  export declare enum CommandHandlerEvents {
    MESSAGE_BLOCKED = "messageBlocked",
    MESSAGE_INVALID = "messageInvalid",
    COMMAND_BLOCKED = "commandBlocked",
    COMMAND_STARTED = "commandStarted",
    COMMAND_FINISHED = "commandFinished",
    COMMAND_CANCELLED = "commandCancelled",
    COMMAND_LOCKED = "commandLocked",
    MISSING_PERMISSIONS = "missingPermissions",
    COOLDOWN = "cooldown",
    IN_PROMPT = "inPrompt",
    ERROR = "error",
    COMMAND_BREAKOUT = "COMMAND_BREAKOUT",
  }
  export declare enum BuiltInReasons {
    CLIENT = "client",
    BOT = "bot",
    OWNER = "owner",
    GUILD = "guild",
    DM = "dm",
  }

  export declare type OrPromise<T> = T | Promise<T>;
  export declare type OrArray<T> = T | T[];
  export declare class Util {
    static isPromise(value: any): boolean;
    static isEventEmitter(value: any): boolean;
    static prefixCompare(
      aKey: string | Function,
      bKey: string | Function
    ): number;
    static intoArray<T extends []>(x: any): T;
    static intoCallable(thing: any): (...args: any[]) => any;
    static flatMap(xs: any[], f: Function): any[];
    static deepAssign(o1: any, ...os: any): any;
    static choice<T>(...xs: T[]): T | null;
  }

  interface Extandables {
    CommandContext: typeof CommandContext;
  }
  export declare abstract class Structures {
    private constructor();
    static get<K extends keyof Extandables>(structure: K): Extandables[K];
    static extend<K extends keyof Extandables, T extends Extandables[K]>(
      structure: K,
      extender: (base: Extandables[K]) => T
    ): T;
  }

  export declare class ListenerHandler extends AkairoHandler<Listener> {
    emitters: Collection<string, EventEmitter>;
    constructor(client: AkairoClient, options?: AkairoHandlerOptions);
    register(listener: Listener, filepath: string): Listener;
    deregister(listener: Listener): void;
    addToEmitter(id: string): Listener;
    removeFromEmitter(id: string): Listener;
    setEmitters(emitters: Record<string, EventEmitter>): this;
  }

  declare type Channel = TextChannel | VoiceChannel;
  export declare type Col<T> = Collection<string, T>;
  export declare class ClientUtil {
    client: AkairoClient;
    constructor(client: AkairoClient);
    resolveUser(
      text: string,
      users: Col<User>,
      caseSensitive?: boolean,
      wholeWord?: boolean
    ): User;
    resolveUsers(
      text: string,
      users: Col<User>,
      caseSensitive?: boolean,
      wholeWord?: boolean
    ): Col<User>;
    checkUser(
      text: string,
      user: User,
      caseSensitive?: boolean,
      wholeWord?: boolean
    ): boolean;
    resolveMember(
      text: string,
      members: Col<GuildMember>,
      caseSensitive?: boolean,
      wholeWord?: boolean
    ): GuildMember;
    resolveMembers(
      text: string,
      members: Col<GuildMember>,
      caseSensitive?: boolean,
      wholeWord?: boolean
    ): Col<GuildMember>;
    checkMember(
      text: string,
      member: GuildMember,
      caseSensitive?: boolean,
      wholeWord?: boolean
    ): boolean;
    resolveChannel(
      text: string,
      channels: Col<Channel>,
      caseSensitive?: boolean,
      wholeWord?: boolean
    ): Channel;
    resolveChannels(
      text: string,
      channels: Col<Channel>,
      caseSensitive?: boolean,
      wholeWord?: boolean
    ): Col<Channel>;
    checkChannel(
      text: string,
      channel: Channel,
      caseSensitive?: boolean,
      wholeWord?: boolean
    ): boolean;
    resolveRole(
      text: string,
      roles: Col<Role>,
      caseSensitive?: boolean,
      wholeWord?: boolean
    ): Role;
    resolveRoles(
      text: string,
      roles: Col<Role>,
      caseSensitive?: boolean,
      wholeWord?: boolean
    ): Col<Role>;
    checkRole(
      text: string,
      role: Role,
      caseSensitive?: boolean,
      wholeWord?: boolean
    ): boolean;
    resolveEmoji(
      text: string,
      emojis: Col<Emoji>,
      caseSensitive?: boolean,
      wholeWord?: boolean
    ): Emoji;
    resolveEmojis(
      text: string,
      emojis: Col<Emoji>,
      caseSensitive?: boolean,
      wholeWord?: boolean
    ): Col<Emoji>;
    checkEmoji(
      text: string,
      emoji: Emoji,
      caseSensitive?: boolean,
      wholeWord?: boolean
    ): boolean;
    resolveGuild(
      text: string,
      guilds: Col<Guild>,
      caseSensitive?: boolean,
      wholeWord?: boolean
    ): Guild;
    resolveGuilds(
      text: string,
      guilds: Col<Guild>,
      caseSensitive?: boolean,
      wholeWord?: boolean
    ): Col<Guild>;
    checkGuild(
      text: string,
      guild: Guild,
      caseSensitive?: boolean,
      wholeWord?: boolean
    ): boolean;
    permissionNames(): string[];
    resolvePermissionNumber(number: number): string[];
    /**
     * Compares two member objects presences and checks if they stopped or started a stream or not.
     * Returns `0`, `1`, or `2` for no change, stopped, or started.
     */
    compareStreaming(oldMember: GuildMember, newMember: GuildMember): number;
    fetchMember(guild: Guild, id: string): Promise<GuildMember>;
    attachment(
      file: BufferResolvable | Stream,
      name?: string
    ): MessageAttachment;
  }
  export declare class Flag {
    type: string;
    command?: Command;
    ignore?: boolean;
    rest?: string;
    message?: Message;
    value?: any;
    constructor(type: string, data?: Record<string, any>);
    static cancel(): Flag;
    static retry(message: Message): Flag;
    static fail(value: any): Flag;
    static continue(command: Command, ignore?: boolean, rest?: string): Flag;
    static is(value: any, type: string): boolean;
  }
  export interface ContentParserOptions {
    flagWords?: string[];
    optionFlagWords?: string[];
    quoted?: boolean;
    separator?: string;
  }
  export interface StringData {
    type: "Phrase" | "Flag" | "OptionFlag";
    raw: string;
    key?: string;
    value?: string;
  }
  export interface ExtractedFlags {
    flagWords: string[];
    optionFlagWords: string[];
  }
  export interface ContentParserResult {
    all: StringData[];
    phrases: StringData[];
    flags: StringData[];
    optionFlags: StringData[];
  }
  export declare class ContentParser {
    flagWords: string[];
    optionFlagWords: string[];
    quoted: boolean;
    separator: string;
    constructor({
      flagWords,
      optionFlagWords,
      quoted,
      separator,
    }?: ContentParserOptions);
    parse(content: string): ContentParserResult;
    /**
     * Extracts the flags from argument options.
     * @param {ArgumentOptions[]} args - Argument options.
     * @returns {ExtractedFlags}
     */
    static getFlags(args: ArgumentOptions[]): Record<string, string[]>;
  }
  export declare class CommandUtil {
    handler: CommandHandler;
    message: Message;
    parsed?: ParsedComponentData;
    shouldEdit: boolean;
    lastResponse?: Message;
    messages?: Collection<string, Message>;
    command: Command;
    context: CommandContext;
    constructor(handler: CommandHandler, message: Message);
    setLastResponse(message: OrArray<Message>): Message;
    addMessage(message: OrArray<Message>): OrArray<Message>;
    setEditable(state: boolean): CommandUtil;
    send(
      content?: StringResolvable,
      options?: MessageOptions | MessageAdditions
    ): Promise<OrArray<Message>>;
    sendNew(
      content?: StringResolvable,
      options?: MessageOptions | MessageAdditions
    ): Promise<OrArray<Message>>;
    /**
     * Sends a response with a mention concantenated to it.
     * @param {StringResolvable} [content=''] - Content to send.
     * @param {MessageOptions|MessageAdditions} [options={}] - Options to use.
     * @returns {Promise<Message|Message[]>}
     */
    reply(
      content: StringResolvable,
      options?: MessageOptions | MessageAdditions
    ): Promise<OrArray<Message>>;
    edit(
      content: StringResolvable,
      options: MessageEditOptions | MessageEmbed
    ): Promise<Message>;
    static transformOptions(
      content?: StringResolvable,
      options?: MessageOptions | MessageAdditions,
      extra?: MessageOptions
    ): MessageOptions;
  }
}
