
declare module "@kyflx-dev/akairo" {
  import {
    BufferResolvable,
    Collection,
    DMChannel,
    Emoji,
    Guild,
    GuildMember,
    Message,
    MessageAdditions,
    MessageAttachment,
    MessageEditOptions,
    MessageEmbed,
    MessageOptions,
    PermissionResolvable,
    Role,
    APIMessage,
    StringResolvable,
    TextChannel,
    User,
    VoiceChannel,
    VoiceState,
    Client
  } from "discord.js";
  import { EventEmitter } from "events";
  import { ISqlite, Statement } from "sqlite";

  interface Extandables {
    CommandContext: typeof CommandContext;
  }

  export declare abstract class Structures {
    private constructor();
    public static get<K extends keyof Extandables>(structure: K): Extandables[K];
    public static extend<K extends keyof Extandables, T extends Extandables[K]>(structure: K, extender: (base: Extandables[K]) => T): T;
  }

  /** Arbys: We Have the Meats */
  export interface SQLProviderOptions {
    idColumn?: string;
    dataColumn?: string;
  }
  
  export abstract class Provider<T extends any> {
    public items: Collection<string, T> = new Collection();
  
    public abstract init(): Promise<any>;
    public abstract get(id: string, key: string, defaultValue?: any): any;
    public abstract set(id: string, key: string, value: any): any;
    public abstract delete(id: string, key: string): any;
    public abstract clear(id: string): any;
  }
  
  export class SequelizeProvider<T extends any> extends Provider<T> {
    public idColumn: string;
    public dataColumn: string;
    public table: any;
    public constructor(table: any, options?: SQLProviderOptions);
    public init(): Promise<void>;
    public get<V>(id: string, key: string, defaultValue: V): V;
    public set(id: string, key: string, value: any): Promise<boolean>;
    public delete(id: string, key: string): Promise<boolean>;
    public clear(id: string): Promise<boolean>
  }

  export declare class SQLiteProvider<T extends any> extends Provider<T> {
    public tableName: string;
    public idColumn: string;
    public dataColumn: string;
    public constructor(db: Database | Promise<Database>, tableName: string, options?: SQLProviderOptions);
    public init(): Promise<void>;
    public get<V>(id: string, key: string, defaultValue: V): V;
    public set(id: string, key: string, value: any): Promise<ISqlite.RunResult<Statement>>;
    public delete(id: string, key: string): Promise<ISqlite.RunResult<Statement>>;
    public clear(id: string): Promise<RunResult<Statement>>;
  }

  export declare class Argument {
    public command: Command;
    public match: ArgumentMatch;
    public type: ArgumentType | ArgumentTypeCaster;
    public flag?: string | string[];
    public multipleFlags: boolean;
    public index?: number;
    public unordered: boolean | number | number[];
    public limit: number;
    public prompt?: ArgumentPromptOptions;
    public default: any | Supplier<FailureData, any>;
    public otherwise?: Content | Supplier<FailureData, Content>;
    public client: AkairoClient;
    public handler: CommandHandler
    public constructor(command: Command, options?: ArgumentOptions);
    public process(message: Message, phrase: string): Promise<Flag | any>;
    public cast(message: Message, phrase: string): Promise<any>;
    public collect(message: Message, commandInput?: string, parsedInput?: any): Promise<Flag | any>;
    public static cast(type: ArgumentType | ArgumentTypeCaster, resolver: TypeResolver, message: Message,phrase: string): Promise<any>;
    public static union(...types: (ArgumentType | ArgumentTypeCaster)[]): ArgumentTypeCaster;
    public static product(...types: (ArgumentType | ArgumentTypeCaster)[]): ArgumentTypeCaster;
    public static validate(type: ArgumentType | ArgumentTypeCaster, predicate: ParsedValuePredicate): ArgumentTypeCaster;
    public static range(type: ArgumentType | ArgumentTypeCaster, min: number, max: number, inclusive?: boolean): ArgumentTypeCaster;
    public static compose(...types: (ArgumentType | ArgumentTypeCaster)[]): ArgumentTypeCaster;
    public static composeWithFailure(...types: (ArgumentType | ArgumentTypeCaster)[]): ArgumentTypeCaster;
    public static withInput(type: ArgumentType | ArgumentTypeCaster): ArgumentTypeCaster;
    public static tagged(type: ArgumentType | ArgumentTypeCaster, tag?: string | RegExp | (string | string[])[] | ArgumentTypeCaster): ArgumentTypeCaster;
    public static taggedWithInput(type: ArgumentType | ArgumentTypeCaster, tag?: string | RegExp | (string | string[])[] | ArgumentTypeCaster): ArgumentTypeCaster;
    public static taggedUnion(...types: (ArgumentType | ArgumentTypeCaster)[]): ArgumentTypeCaster;
    public static isFailure(value: any): boolean;
  }

  export declare class TypeResolver {
    public handler: CommandHandler;
    public client: AkairoClient;
    public types: Collection<string, ArgumentTypeCaster>;
    public commandHandler: CommandHandler;
    public inhibitorHandler: InhibitorHandler;
    public listenerHandler: ListenerHandler;
    public constructor(handler: CommandHandler);
    public addBuiltInTypes(): void;
    public type(name: string): ArgumentTypeCaster;
    public addType(name: string, fn: ArgumentTypeCaster): TypeResolver;
    public addTypes(types: Record<string, ArgumentTypeCaster>): TypeResolver;
  }

  export declare class Listener extends AkairoModule {
    public emitter: string | EventEmitter;
    public event: string;
    public type: ListenerType;
    public handler: ListenerHandler;
    public constructor(id: string, options?: ListenerOptions);
    public exec(): void;
  }

  export declare class ListenerHandler extends AkairoHandler<Listener> {
    public emitters: Collection<string, EventEmitter>;
    public constructor(client: AkairoClient, options?: AkairoHandlerOptions);
    public register(listener: Listener, filepath: string): Listener;
    public deregister(listener: Listener): void;
    public addToEmitter(id: string): Listener;
    public removeFromEmitter(id: string): Listener;
    public setEmitters(emitters: Record<string, EventEmitter>): this;
    public on(event: 'remove', listener: (listener: Listener) => any): this;
    public on(event: 'load', listener: (listener: Listener, isReload: boolean) => any): this;
  }

  export declare class Command extends AkairoModule {
    public aliases: string[];
    public channel: "dm" | "guild";
    public ownerOnly: boolean;
    public editable: boolean;
    public typing: boolean;
    public cooldown: number;
    public handler: CommandHandler;
    public ratelimit: number;
    public argumentDefaults: DefaultArgumentOptions;
    public description: any;
    public prefix: OrArray<string> | PrefixSupplier;
    public clientPermissions: Permissions;
    public userPermissions: Permissions;
    public regex: RegExp | UsesContext<RegExp>;
    public lock: KeySupplier;
    public ignoreCooldown: OrArray<string> | IngoreCheckPredicate;
    public ignorePermissions: OrArray<string> | IngoreCheckPredicate;
    public constructor(id: string, options?: CommandOptions): Command;
    public before(ctx: CommandContext): OrPromise<boolean>;
    public condition(ctx: CommandContext): boolean;
    public exec(ctx: CommandContext, args?: Record<string, any>): Promise<any>;
  }

  export declare class CommandContext {
    public util: CommandUtil;
    public handler: CommandHandler;
    public message: Message;
    public guild?: Guild;
    public member?: GuildMember;
    public channel: TextChannel | DMChannel;
    public author: User;
    public constructor(util: CommandUtil);
    public _fix(message: Message): void;
    public get voiceState(): VoiceState;
    public get vc(): VoiceChannel;
  }

  export declare class CommandHandler extends AkairoHandler<Command> {
    public resolver: TypeResolver;
    public aliases: Collection<string, string>;
    public prefixes: Collection<string | PrefixSupplier, Set<string>>;
    public commandUtils: Collection<string, CommandUtil>;
    public prompts: Collection<string, Set<string>>;
    public inhibitorHandler?: InhibitorHandler;
    public cooldowns: Collection<string, Record<string, CooldownData>>;
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
    public constructor(client: AkairoClient, options?: CommandHandlerOptions);
    public setup(): void;
    public register(command: Command, filepath?: string): void;
    public deregister(command: Command): void;
    public handle(message: Message): Promise<void | boolean>;
    public handleDirectCommand(message: Message, content: string, command: Command, ignore?: boolean): Promise<void | boolean>;
    public handleRegexAndConditionalCommands(message: Message): Promise<boolean>;
    public handleRegexCommands(message: Message): Promise<boolean>;
    public handleConditionalCommands(message: Message): Promise<boolean>;
    public runAllTypeInhibitors(message: Message): Promise<boolean>;
    public runPreTypeInhibitors(message: Message): Promise<boolean>;
    public runPostTypeInhibitors(message: Message, command: Command): Promise<boolean>;
    public runPermissionChecks(message: Message, command: Command): Promise<boolean>;
    public runCooldowns(message: Message, command: Command): boolean;
    public runCommand(message: Message, command: Command, args: Record<string, any>): Promise<void>;
    public parseCommand(message: Message): Promise<ParsedComponentData>;
    public parseCommandOverwrittenPrefixes(message: Message): Promise<ParsedComponentData>;
    public parseMultiplePrefixes(message: Message, pairs: [string, Set<string> | null][]): ParsedComponentData;
    public parseWithPrefix(message: Message, prefix: string, associatedCommands?: Set<string>): ParsedComponentData;
    public emitError(err: Error, message: Message, command?: Command): void;
    public sweepCommandUtil(lifetime?: number): number;
    public addPrompt(channel: Channel, user: User): void;
    public removePrompt(channel: Channel, user: User): void;
    public hasPrompt(channel: Channel, user: User): boolean;
    public findCommand(name: string): Command;
    public useInhibitorHandler(inhibitorHandler: InhibitorHandler): this;
    public useListenerHandler(listenerHandler: ListenerHandler): this;

    public on(event: 'remove', listener: (command: Command) => any): this;
    public on(event: 'load', listener: (command: Command, isReload: boolean) => any): this;
    public on(event: 'commandBlocked', listener: (message: Message, command: Command, reason: string) => any): this;
    public on(event: 'commandBreakout', listener: (message: Message, command: Command, breakMessage: Message) => any): this;
    public on(event: 'commandCancelled', listener: (message: Message, command: Command, retryMessage?: Message) => any): this;
    public on(event: 'commandFinished', listener: (message: Message, command: Command, args: any, returnValue: any) => any): this;
    public on(event: 'commandLocked', listener: (message: Message, command: Command) => any): this;
    public on(event: 'commandStarted', listener: (message: Message, command: Command, args: any) => any): this;
    public on(event: 'cooldown', listener: (message: Message, command: Command, remaining: number) => any): this;
    public on(event: 'error', listener: (error: Error, message: Message, command?: Command) => any): this;
    public on(event: 'inPrompt' | 'messageInvalid', listener: (message: Message) => any): this;
    public on(event: 'messageBlocked', listener: (message: Message, reason: string) => any): this;
    public on(event: 'missingPermissions', listener: (message: Message, command: Command, type: 'client' | 'user', missing?: any) => any): this;
  }

  export declare class CommandUtil {
    public handler: CommandHandler;
    public message: Message;
    public parsed?: ParsedComponentData;
    public shouldEdit: boolean;
    public lastResponse?: Message;
    public messages?: Collection<string, Message>;
    public command: Command;
    public context: CommandContext;
    public constructor(handler: CommandHandler, message: Message);
    public setLastResponse(message: OrArray<Message>): Message;
    public addMessage(message: OrArray<Message>): OrArray<Message>;
    public setEditable(state: boolean): CommandUtil;
    public send(content?: StringResolvable, options?: MessageOptions | MessageAdditions): Promise<OrArray<Message>>;
    public sendNew(content?: StringResolvable, options?: MessageOptions | MessageAdditions): Promise<OrArray<Message>>;
    public reply(content: StringResolvable, options?: MessageOptions | MessageAdditions): Promise<OrArray<Message>>;
    public edit(content: StringResolvable, options: MessageEditOptions | MessageEmbed): Promise<Message>;
    public static transformOptions(content?: StringResolvable, options?: MessageOptions | MessageAdditions, extra?: MessageOptions): MessageOptions;
  }

  export declare class Flag {
    public type: string;
    public constructor(type: string, data?: Record<string, any>);
    public static cancel(): Flag;
    public static retry(message: Message): Flag;
    public static fail(value: any): Flag;
    public static continue(command: string, ignore?: boolean, rest?: string): Flag & { command: string, ignore: boolean, rest: string };
    public static is(value: any, type: 'cancel'): value is Flag;
    public static is(value: any, type: 'continue'): value is Flag & { command: string, ignore: boolean, rest: string };
    public static is(value: any, type: 'retry'): value is Flag & { message: Message };
    public static is(value: any, type: 'fail'): value is Flag & { value: any };
    public static is(value: any, type: string): value is Flag;  }

  export declare class Inhibitor extends AkairoModule {
    public handler: InhibitorHandler;
    public reason: string;
    public type: InhibitorType;
    public priority: number;
    public constructor(id: string, options?: InhibitorOptions);
    public exec(ctx: Message | CommandContext, command?: Command): Promise<boolean> | boolean;
  }

  export declare class InhibitorHandler extends AkairoHandler<Inhibitor> {
    public constructor(client: AkairoClient, options?: AkairoHandlerOptions);
    public test(type: InhibitorType, message: Message, command?: Command): Promise<string | void>;
    public on(event: 'remove', listener: (inhibitor: Inhibitor) => any): this;
    public on(event: 'load', listener: (inhibitor: Inhibitor, isReload: boolean) => any): this; 
  }

  export declare class AkairoClient extends Client {
    public util: ClientUtil;
    public ownerID: Snowflake | Snowflake[];
    public constructor(options?: AkairoOptions & ClientOptions);
    public isOwner(user: UserResolvable): boolean;
  }

  export declare class AkairoHandler<T extends AkairoModule> extends EventEmitter {
    public client: AkairoClient;
    public directory?: string;
    public classToHandle: Function;
    public extensions: Set<string>;
    public automateCategories: boolean;
    public loadFilter: LoadPredicate;
    public modules: Collection<string, T>;
    public categories: Collection<string, Category<T>>;
    public constructor(client: AkairoClient, options?: AkairoHandlerOptions);
    public register(mod: T, filepath: string): void;
    public deregister(mod: T): void;
    public load(thing: string | Function, isReload?: boolean): T | undefined;
    public loadAll(directory?: string, filter?: LoadPredicate): this;
    public remove(id: string): void;
    public removeAll(): this;
    public reload(id: string): T;
    public reloadAll(): this;
    public findCategory(name: string): Category<T>;
    public static readdirRecursive(directory: string): string[];
    public on(event: 'remove', listener: (mod: AkairoModule) => any): this;
    public on(event: 'load', listener: (mod: AkairoModule, isReload: boolean) => any): this;
  }

  export declare abstract class AkairoModule {
    public id: string;
    public categoryID: string;
    public filepath?: string;
    public category?: Category<AkairoModule>;
    public client: AkairoClient;
    public handler: AkairoHandler<AkairoModule>;
    public constructor(id: string, options?: AkairoModuleOptions);
    public reload(): AkairoModule;
    public remove(): void;
    public toString(): string;
  }

  export declare class ClientUtil {
    public client: AkairoClient;
    public constructor(client: AkairoClient);
    public resolveUser(text: string, users: Col<User>, caseSensitive?: boolean, wholeWord?: boolean): User;
    public resolveUsers(text: string, users: Col<User>, caseSensitive?: boolean, wholeWord?: boolean): Col<User>;
    public checkUser(text: string, user: User, caseSensitive?: boolean, wholeWord?: boolean): boolean;
    public resolveMember(text: string, members: Col<GuildMember>, caseSensitive?: boolean, wholeWord?: boolean): GuildMember;
    public resolveMembers(text: string, members: Col<GuildMember>, caseSensitive?: boolean, wholeWord?: boolean): Col<GuildMember>;
    public checkMember(text: string, member: GuildMember, caseSensitive?: boolean, wholeWord?: boolean): boolean;
    public resolveChannel(text: string, channels: Col<Channel>, caseSensitive?: boolean, wholeWord?: boolean): Channel;
    public resolveChannels(text: string, channels: Col<Channel>, caseSensitive?: boolean, wholeWord?: boolean): Col<Channel>;
    public checkChannel(text: string, channel: Channel, caseSensitive?: boolean, wholeWord?: boolean): boolean;
    public resolveRole(text: string, roles: Col<Role>, caseSensitive?: boolean, wholeWord?: boolean): Role;
    public resolveRoles(text: string, roles: Col<Role>, caseSensitive?: boolean, wholeWord?: boolean): Col<Role>;
    public checkRole(text: string, role: Role, caseSensitive?: boolean, wholeWord?: boolean): boolean;
    public resolveEmoji(text: string, emojis: Col<Emoji>, caseSensitive?: boolean, wholeWord?: boolean): Emoji;
    public resolveEmojis(text: string, emojis: Col<Emoji>, caseSensitive?: boolean, wholeWord?: boolean): Col<Emoji>;
    public checkEmoji(text: string, emoji: Emoji, caseSensitive?: boolean, wholeWord?: boolean): boolean;
    public resolveGuild(text: string, guilds: Col<Guild>, caseSensitive?: boolean, wholeWord?: boolean): Guild;
    public resolveGuilds(text: string, guilds: Col<Guild>, caseSensitive?: boolean, wholeWord?: boolean): Col<Guild>;
    public checkGuild(text: string, guild: Guild, caseSensitive?: boolean, wholeWord?: boolean): boolean;
    public permissionNames(): string[];
    public resolvePermissionNumber(number: number): string[];
    public compareStreaming(oldMember: GuildMember, newMember: GuildMember): number;
    public fetchMember(guild: Guild, id: string): Promise<GuildMember>;
    public attachment(file: BufferResolvable | Stream, name?: string): MessageAttachment;
  }

  export declare class AkairoError extends Error {
    public code: string;
    public constructor(key: string, ...args: any[]);
    public get name(): string;
  }

  export declare class Category<T extends AkairoModule> extends Collection<string, T> {
    public id: string;
    public constructor(id: string, iterable?: readonly (readonly [string, T])[]);
    public reloadAll(): this;
    public removeAll(): this;
    public toString(): string;
  }

  export declare class Util {
    public static isPromise(value: any): boolean;
    public static isEventEmitter(value: any): boolean;
    public static prefixCompare(aKey: string | Function, bKey: string | Function): number;
    public static intoArray<T extends []>(x: any): T;
    public static intoCallable(thing: any): (...args: any[]) => any;
    public static flatMap(xs: any[], f: Function): any[];
    public static deepAssign(o1: any, ...os: any): any;
    public static choice<T>(...xs: T[]): T | null;
  }

  /** Types and Interfaces */
  declare type Channel = TextChannel | VoiceChannel;

  declare type Permissions = OrArray<PermissionResolvable> | PermissionSupplier;

  export declare type Col<T> = Collection<string, T>;

  export declare type PrefixSupplier = (ctx: CommandContext) => OrPromise<OrArray<string>>;

  export declare type UsesContext<T> = (ctx: CommandContext) => T | Promise<T>;

  export declare type PermissionSupplier = (ctx: CommandContext) => OrPromise<OrArray<PermissionResolvable>>;

  export declare type KeySupplier = (ctx: CommandContext, args?: any) => string;

  export declare type ExecutionPredicate = (ctx: CommandContext) => boolean;

  export declare type IngoreCheckPredicate = (ctx: CommandContext, command?: Command) => boolean;

  export declare type ArgumentGenerator = (ctx: CommandContext, parsed: ContentParserResult, state: ArgumentRunnerState) => IterableIterator<ArgumentOptions | Flag>;

  export declare type ArgumentMatch = 'phrase' | 'flag' | 'option' | 'rest' | 'separate' | 'text' | 'content' | 'restContent' | 'none';

  export declare type ArgumentType = "string" | "lowercase" | "uppercase" | "charCodes" | "number" | "integer" | "bigint" | "emojint" | "url" | "date" | "color" | "user" | "users" | "member" | "members" | "relevant" | "relevants" | "channel" | "channels" | "textChannel" | "textChannels" | "voiceChannel" | "voiceChannels" | "categoryChannel" | "categoryChannels" | "newsChannel" | "newsChannels" | "storeChannel" | "storeChannels" | 'role' | 'roles' | 'emoji' | 'emojis' | 'guild' | 'guilds' | 'message' | 'guildMessage' | 'relevantMessage' | 'invite' | 'userMention' | 'memberMention' | 'channelMention' | 'roleMention' | 'emojiMention' | 'commandAlias' | 'command' | 'inhibitor' | 'listener' | (string | string[])[] | RegExp | string;

  export declare type Content = StringResolvable | MessageOptions | MessageAdditions;

  export declare type Modifier<D, T> = (ctx?: CommandContext, text?: Content, data?: D) => T | Promise<T>;

  export declare type Supplier<D, T> = (ctx?: CommandContext, data?: D) => T | Promise<T>;

  export declare type ArgumentTypeCaster = (ctx?: CommandContext, value?: any) => any;

  export declare type ParsedValuePredicate = (ctx?: CommandContext, phrase?: string, value?: any) => boolean;

  export declare type InhibitorType = "all" | "pre" | "post";

  export declare type LoadPredicate = (filepath: string) => boolean;

  export declare type OrPromise<T> = T | Promise<T>;

  export declare type OrArray<T> = T | T[];

  export declare type ListenerType = "on" | "once" | "off";

  export interface ListenerOptions extends AkairoModuleOptions {
    emitter: string | EventEmitter;
    event: string;
    type?: ListenerType;
  }

  export interface AkairoHandlerOptions {
    automateCategories?: boolean;
    classToHandle?: Function;
    directory?: string;
    extensions?: string[] | Set<string>;
    loadFilter?: LoadPredicate;
  }  

  export interface AkairoModuleOptions {
    category?: string;
  }

  export interface AkairoOptions {
    ownerID?: Snowflake | Snowflake[];
  }

  export interface InhibitorOptions extends AkairoModuleOptions {
    reason?: string;
    type?: InhibitorType;
    priority?: number;
  }

  export interface FailureData {
    phrase: string;
    failure: void | Flag;
  }

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

  export interface DefaultArgumentOptions {
    prompt?: ArgumentPromptOptions;
    otherwise?: Content | Supplier<FailureData, Content>;
    modifyOtherwise?: Supplier<FailureData, Content>;
  }

  export interface ArgumentRunnerState {
    usedIndices: Set<number>;
    phraseIndex: number;
    index: number;
  }

  export interface ArgumentPromptData {
    retries: number;
    infinite: boolean;
    message: Message;
    phrase: string;
    failure: void | Flag;
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

  /** Constants */
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
}