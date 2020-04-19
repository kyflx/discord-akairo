import {
  Message,
  Collection,
  StringResolvable,
  MessageOptions,
  MessageAdditions,
  APIMessage,
  MessageEditOptions,
  MessageEmbed,
} from "discord.js";
import { ParsedComponentData, CommandHandler } from "./CommandHandler";
import { OrArray } from "../../util";
import { Command } from "./Command";
import { CommandContext } from "./CommandContext";
import { Structures } from "..";

export class CommandUtil {
  public parsed?: ParsedComponentData;
  public shouldEdit: boolean = false;
  public lastResponse?: Message;
  public messages?: Collection<string, Message>;
  public command: Command;
  public context: CommandContext = new (Structures.get("CommandContext"))(this);
  constructor(public handler: CommandHandler, public message: Message) {
    this.messages = this.handler.storeMessages ? new Collection() : null;
  }

  public setLastResponse(message: OrArray<Message>): Message {
    if (Array.isArray(message)) {
      this.lastResponse = message.slice(-1)[0];
    } else {
      this.lastResponse = message;
    }

    return this.lastResponse;
  }

  public addMessage(message: OrArray<Message>): OrArray<Message> {
    if (Array.isArray(message)) {
      for (const msg of message) {
        Object.defineProperty(msg, "util", { value: this });
        if (this.handler.storeMessages) this.messages.set(msg.id, msg);
      }
    } else {
      Object.defineProperty(message, "util", { value: this });
      if (this.handler.storeMessages) this.messages.set(message.id, message);
    }

    return message;
  }

  public setEditable(state: boolean): CommandUtil {
    this.shouldEdit = Boolean(state);
    return this;
  }

  public async send(
    content?: StringResolvable,
    options?: MessageOptions | MessageAdditions
  ): Promise<OrArray<Message>> {
    const transformedOptions = CommandUtil.transformOptions(content, options);
    const hasFiles =
      (transformedOptions.files && transformedOptions.files.length > 0) ||
      (transformedOptions.embed &&
        transformedOptions.embed.files &&
        transformedOptions.embed.files.length > 0);

    if (
      this.shouldEdit &&
      (this.command ? this.command.editable : true) &&
      !hasFiles &&
      !this.lastResponse.deleted &&
      !this.lastResponse.attachments.size
    ) {
      return this.lastResponse.edit(transformedOptions);
    }

    const sent = await this.message.channel.send(transformedOptions);
    const lastSent = this.setLastResponse(sent);
    this.setEditable(!lastSent.attachments.size);
    return sent;
  }

  public async sendNew(
    content?: StringResolvable,
    options?: MessageOptions | MessageAdditions
  ): Promise<OrArray<Message>> {
    const sent = await this.message.channel.send(
      CommandUtil.transformOptions(content, options)
    );
    const lastSent = this.setLastResponse(sent);
    this.setEditable(!lastSent.attachments.size);
    return sent;
  }

  public reply(
    content: StringResolvable,
    options?: MessageOptions | MessageAdditions
  ): Promise<OrArray<Message>> {
    return this.send(
      CommandUtil.transformOptions(content, options, {
        reply: this.message.member || this.message.author,
      })
    );
  }

  public edit(
    content: StringResolvable,
    options: MessageEditOptions | MessageEmbed
  ): Promise<Message> {
    return this.lastResponse.edit(content, options);
  }

  public static transformOptions(
    content?: StringResolvable,
    options?: MessageOptions | MessageAdditions,
    extra?: MessageOptions
  ): MessageOptions {
    const transformedOptions = APIMessage.transformOptions(
      content,
      options,
      extra
    ) as MessageOptions;
    if (!transformedOptions.content) transformedOptions.content = null;
    if (!transformedOptions.embed) transformedOptions.embed = null;
    return transformedOptions;
  }
}
