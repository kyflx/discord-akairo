// @ts-nocheck
import {
  Message,
  StringResolvable,
  MessageOptions,
  MessageAdditions,
} from "discord.js";
import { Flag } from "../Flag";
import AkairoClient from "../../AkairoClient";
import { Util, ArgumentTypes, ArgumentMatches } from "../../../util";
import { TypeResolver } from "./TypeResolver";
import { Command } from "../Command";
import { CommandHandler } from "../CommandHandler";

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

export interface FailureData {
  phrase: string;
  failure: void | Flag;
}

export interface DefaultArgumentOptions {
  prompt?: ArgumentPromptOptions;
  otherwise?: Content | Supplier<FailureData, Content>;
  modifyOtherwise?: Supplier<FailureData, Content>;
}

export type ArgumentMatch =
  | "phrase"
  | "flag"
  | "option"
  | "rest"
  | "separate"
  | "text"
  | "content"
  | "restContent"
  | "none";
export type ArgumentType =
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
export type Content = StringResolvable | MessageOptions | MessageAdditions;
export type Modifier<D, T> = (
  ctx?: any,
  text?: Content,
  data?: D
) => T | Promise<T>;
export type Supplier<D, T> = (ctx?: any, data?: D) => T | Promise<T>;
export type ArgumentTypeCaster = (ctx?: any, value?: any) => any;
export type ParsedValuePredicate = (
  ctx?: any,
  phrase?: string,
  value?: any
) => boolean;

export class Argument {
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
  private modifyOtherwise: Modifier<FailureData, Content>;

  constructor(
    public command: Command,
    {
      match = ArgumentMatches.PHRASE,
      type = ArgumentTypes.STRING,
      flag = null,
      multipleFlags = false,
      index = null,
      unordered = false,
      limit = Infinity,
      prompt = null,
      default: defaultValue = null,
      otherwise = null,
      modifyOtherwise = null,
    }: ArgumentOptions = {}
  ) {
    this.match = match;
    this.type = typeof type === "function" ? type.bind(this) : type;
    this.flag = flag;
    this.multipleFlags = multipleFlags;
    this.index = index;
    this.unordered = unordered;
    this.limit = limit;
    this.prompt = prompt;
    this.default =
      typeof defaultValue === "function"
        ? defaultValue.bind(this)
        : defaultValue;
    this.otherwise =
      typeof otherwise === "function" ? otherwise.bind(this) : otherwise;
    this.modifyOtherwise = modifyOtherwise;
  }

  public get client(): AkairoClient {
    return this.command.client;
  }

  public get handler(): CommandHandler {
    return this.command.handler;
  }

  public async process(message: Message, phrase: string): Promise<Flag | any> {
    const commandDefs = this.command.argumentDefaults;
    const handlerDefs = this.handler.argumentDefaults;
    const optional = Util.choice(
      this.prompt && this.prompt.optional,
      commandDefs.prompt && commandDefs.prompt.optional,
      handlerDefs.prompt && handlerDefs.prompt.optional
    );

    const doOtherwise = async (failure?: FailureData) => {
      const otherwise = Util.choice(
        this.otherwise,
        commandDefs.otherwise,
        handlerDefs.otherwise
      );

      const modifyOtherwise = Util.choice(
        this.modifyOtherwise,
        commandDefs.modifyOtherwise,
        handlerDefs.modifyOtherwise
      );

      let text = await Util.intoCallable(otherwise).call(
        this,
        message.util.context,
        {
          phrase,
          failure,
        }
      );
      if (Array.isArray(text)) {
        text = text.join("\n");
      }

      if (modifyOtherwise) {
        text = await modifyOtherwise.call(this, message.util.context, text, {
          phrase,
          failure,
        });
        if (Array.isArray(text)) {
          text = text.join("\n");
        }
      }

      if (text) {
        const sent = await message.channel.send(text);
        if (message.util) message.util.addMessage(sent);
      }

      return Flag.cancel();
    };

    if (!phrase && optional) {
      if (this.otherwise != null) {
        return doOtherwise(null);
      }

      return Util.intoCallable(this.default)(message.util.context, {
        phrase,
        failure: null,
      });
    }

    const res = await this.cast(message, phrase);
    if (Argument.isFailure(res)) {
      if (this.otherwise != null) {
        return doOtherwise(res);
      }

      if (this.prompt != null) {
        return this.collect(message, phrase, res);
      }

      return this.default == null
        ? res
        : Util.intoCallable(this.default)(message.util.context, {
            phrase,
            failure: res,
          });
    }

    return res;
  }

  public cast(message: Message, phrase: string): Promise<any> {
    return Argument.cast(this.type, this.handler.resolver, message, phrase);
  }

  public async collect(
    message: Message,
    commandInput: string = "",
    parsedInput: any = null
  ): Promise<Flag | any> {
    const promptOptions: ArgumentPromptOptions = {};
    Object.assign(promptOptions, this.handler.argumentDefaults.prompt);
    Object.assign(promptOptions, this.command.argumentDefaults.prompt);
    Object.assign(promptOptions, this.prompt || {});

    const isInfinite =
      promptOptions.infinite ||
      (this.match === ArgumentMatches.SEPARATE && !commandInput);
    const additionalRetry = Number(Boolean(commandInput));
    const values: any[] = isInfinite ? [] : null;

    const getText = async (
      promptType: string,
      prompter: Supplier<ArgumentPromptData, Content>,
      retryCount: number,
      inputMessage: Message,
      inputPhrase: string,
      inputParsed: any
    ) => {
      let text = await Util.intoCallable(prompter).call(
        this,
        message.util.context,
        {
          retries: retryCount,
          infinite: isInfinite,
          message: inputMessage,
          phrase: inputPhrase,
          failure: inputParsed,
        }
      );

      if (Array.isArray(text)) {
        text = text.join("\n");
      }

      const modifier: Modifier<ArgumentPromptData, Content> = ({
        start: promptOptions.modifyStart,
        retry: promptOptions.modifyRetry,
        timeout: promptOptions.modifyTimeout,
        ended: promptOptions.modifyEnded,
        cancel: promptOptions.modifyCancel,
      } as Record<string, any>)[promptType];

      if (modifier) {
        text = await modifier.call(this, message.util.context, text, {
          retries: retryCount,
          infinite: isInfinite,
          message: inputMessage,
          phrase: inputPhrase,
          failure: inputParsed,
        });

        if (Array.isArray(text)) {
          text = text.join("\n");
        }
      }

      return text;
    };

    // eslint-disable-next-line complexity
    const promptOne = async (
      prevMessage: Message,
      prevInput: string,
      prevParsed: any,
      retryCount: number
    ): Promise<any> => {
      let sentStart;
      // This is either a retry prompt, the start of a non-infinite, or the start of an infinite.
      if (retryCount !== 1 || !isInfinite || !values.length) {
        const promptType = retryCount === 1 ? "start" : "retry";
        const prompter =
          retryCount === 1 ? promptOptions.start : promptOptions.retry;
        const startText = await getText(
          promptType,
          prompter,
          retryCount,
          prevMessage,
          prevInput,
          prevParsed
        );

        if (startText) {
          sentStart = await (message.util || message.channel).send(startText);
          if (message.util) {
            message.util.setEditable(false);
            message.util.setLastResponse(sentStart);
            message.util.addMessage(sentStart);
          }
        }
      }

      let input;
      try {
        input = (
          await message.channel.awaitMessages(
            (m: Message) => m.author.id === message.author.id,
            {
              max: 1,
              time: promptOptions.time,
              errors: ["time"],
            }
          )
        ).first();

        if (message.util) message.util.addMessage(input);
      } catch (err) {
        const timeoutText = await getText(
          "timeout",
          promptOptions.timeout,
          retryCount,
          prevMessage,
          prevInput,
          ""
        );
        if (timeoutText) {
          const sentTimeout = await message.channel.send(timeoutText);
          if (message.util) message.util.addMessage(sentTimeout);
        }

        return Flag.cancel();
      }

      if (promptOptions.breakout) {
        const looksLike = await this.handler.parseCommand(input);
        if (looksLike && looksLike.command) return Flag.retry(input);
      }

      if (
        input.content.toLowerCase() === promptOptions.cancelWord.toLowerCase()
      ) {
        const cancelText = await getText(
          "cancel",
          promptOptions.cancel,
          retryCount,
          input,
          input.content,
          "cancel"
        );
        if (cancelText) {
          const sentCancel = await message.channel.send(cancelText);
          if (message.util) message.util.addMessage(sentCancel);
        }

        return Flag.cancel();
      }

      if (
        isInfinite &&
        input.content.toLowerCase() === promptOptions.stopWord.toLowerCase()
      ) {
        if (!values.length)
          return promptOne(input, input.content, null, retryCount + 1);
        return values;
      }

      const parsedValue = await this.cast(input, input.content);
      if (Argument.isFailure(parsedValue)) {
        if (retryCount <= promptOptions.retries) {
          return promptOne(input, input.content, parsedValue, retryCount + 1);
        }

        const endedText = await getText(
          "ended",
          promptOptions.ended,
          retryCount,
          input,
          input.content,
          "stop"
        );
        if (endedText) {
          const sentEnded = await message.channel.send(endedText);
          if (message.util) message.util.addMessage(sentEnded);
        }

        return Flag.cancel();
      }

      if (isInfinite) {
        values.push(parsedValue);
        const limit = promptOptions.limit;
        if (values.length < limit)
          return promptOne(message, input.content, parsedValue, 1);

        return values;
      }

      return parsedValue;
    };

    this.handler.addPrompt(message.channel, message.author);
    const returnValue = await promptOne(
      message,
      commandInput,
      parsedInput,
      1 + additionalRetry
    );
    if (this.handler.commandUtil) {
      message.util.setEditable(false);
    }

    this.handler.removePrompt(message.channel, message.author);
    return returnValue;
  }

  public static async cast(
    type: ArgumentType | ArgumentTypeCaster,
    resolver: TypeResolver,
    message: Message,
    phrase: string
  ) {
    if (Array.isArray(type)) {
      for (const entry of type) {
        if (Array.isArray(entry)) {
          if (entry.some((t) => t.toLowerCase() === phrase.toLowerCase())) {
            return entry[0];
          }
        } else if (entry.toLowerCase() === phrase.toLowerCase()) {
          return entry;
        }
      }

      return null;
    }

    if (typeof type === "function") {
      let res = type(message, phrase);
      if (Util.isPromise(res)) res = await res;
      return res;
    }

    if (type instanceof RegExp) {
      const match = phrase.match(type);
      if (!match) return null;

      const matches = [];

      if (type.global) {
        let matched;

        while ((matched = type.exec(phrase)) != null) {
          matches.push(matched);
        }
      }

      return { match, matches };
    }

    if (resolver.type(type)) {
      let res = resolver.type(type).call(this, message.util.context, phrase);
      if (Util.isPromise(res)) res = await res;
      return res;
    }

    return phrase || null;
  }

  public static union(
    ...types: (ArgumentType | ArgumentTypeCaster)[]
  ): ArgumentTypeCaster {
    return async function typeFn(message, phrase) {
      for (let entry of types) {
        if (typeof entry === "function") entry = entry.bind(this);
        const res = await Argument.cast(
          entry,
          this.handler.resolver,
          message,
          phrase
        );
        if (!Argument.isFailure(res)) return res;
      }

      return null;
    };
  }

  public static product(
    ...types: (ArgumentType | ArgumentTypeCaster)[]
  ): ArgumentTypeCaster {
    return async function typeFn(message, phrase) {
      const results = [];
      for (let entry of types) {
        if (typeof entry === "function") entry = entry.bind(this);
        const res = await Argument.cast(
          entry,
          this.handler.resolver,
          message,
          phrase
        );
        if (Argument.isFailure(res)) return res;
        results.push(res);
      }

      return results;
    };
  }

  public static validate(
    type: ArgumentType | ArgumentTypeCaster,
    predicate: ParsedValuePredicate
  ): ArgumentTypeCaster {
    return async function typeFn(message, phrase) {
      if (typeof type === "function") type = type.bind(this);
      const res = await Argument.cast(
        type,
        this.handler.resolver,
        message,
        phrase
      );
      if (Argument.isFailure(res)) return res;
      if (!predicate.call(this, message.util.context, phrase, res)) return null;
      return res;
    };
  }

  public static range(
    type: ArgumentType | ArgumentTypeCaster,
    min: number,
    max: number,
    inclusive = false
  ): ArgumentTypeCaster {
    return Argument.validate(type, (_, p, x) => {
      const o =
        typeof x === "number" || typeof x === "bigint"
          ? x
          : x.length != null
          ? x.length
          : x.size != null
          ? x.size
          : x;

      return o >= min && (inclusive ? o <= max : o < max);
    });
  }

  public static compose(
    ...types: (ArgumentType | ArgumentTypeCaster)[]
  ): ArgumentTypeCaster {
    return async function typeFn(message, phrase) {
      let acc = phrase;
      for (let entry of types) {
        if (typeof entry === "function") entry = entry.bind(this);
        acc = await Argument.cast(entry, this.handler.resolver, message, acc);
        if (Argument.isFailure(acc)) return acc;
      }

      return acc;
    };
  }

  public static composeWithFailure(
    ...types: (ArgumentType | ArgumentTypeCaster)[]
  ): ArgumentTypeCaster {
    return async function typeFn(message, phrase) {
      let acc = phrase;
      for (let entry of types) {
        if (typeof entry === "function") entry = entry.bind(this);
        acc = await Argument.cast(entry, this.handler.resolver, message, acc);
      }

      return acc;
    };
  }

  public static withInput(
    type: ArgumentType | ArgumentTypeCaster
  ): ArgumentTypeCaster {
    return async function typeFn(message, phrase) {
      if (typeof type === "function") type = type.bind(this);
      const res = await Argument.cast(
        type,
        this.handler.resolver,
        message,
        phrase
      );
      if (Argument.isFailure(res)) {
        return Flag.fail({ input: phrase, value: res });
      }

      return { input: phrase, value: res };
    };
  }

  public static tagged(
    type: ArgumentType | ArgumentTypeCaster,
    tag = type
  ): ArgumentTypeCaster {
    return async function typeFn(message, phrase) {
      if (typeof type === "function") type = type.bind(this);
      const res = await Argument.cast(
        type,
        this.handler.resolver,
        message,
        phrase
      );
      if (Argument.isFailure(res)) {
        return Flag.fail({ tag, value: res });
      }

      return { tag, value: res };
    };
  }

  public static taggedWithInput(
    type: ArgumentType | ArgumentTypeCaster,
    tag = type
  ): ArgumentTypeCaster {
    return async function typeFn(message, phrase) {
      if (typeof type === "function") type = type.bind(this);
      const res = await Argument.cast(
        type,
        this.handler.resolver,
        message,
        phrase
      );
      if (Argument.isFailure(res)) {
        return Flag.fail({ tag, input: phrase, value: res });
      }

      return { tag, input: phrase, value: res };
    };
  }

  public static taggedUnion(
    ...types: (ArgumentType | ArgumentTypeCaster)[]
  ): ArgumentTypeCaster {
    return async function typeFn(message, phrase) {
      for (let entry of types) {
        entry = Argument.tagged(entry);
        const res = await Argument.cast(
          entry,
          this.handler.resolver,
          message,
          phrase
        );
        if (!Argument.isFailure(res)) return res;
      }

      return null;
    };
  }

  public static isFailure(value: any): boolean {
    return value == null || Flag.is(value, "fail");
  }
}
