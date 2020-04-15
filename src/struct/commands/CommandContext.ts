import { Message, Guild, GuildMember, TextChannel, DMChannel, User } from "discord.js";
import { CommandHandler } from "./CommandHandler";
import { CommandUtil } from "./CommandUtil";
import { VoiceState } from "discord.js";
import { VoiceChannel } from "discord.js";

export type UsesContext<T> = (ctx: CommandContext) => T | Promise<T>;

export class CommandContext {
  public handler: CommandHandler;

  public message: Message;
  public guild?: Guild;
  public member?: GuildMember;
  public channel: TextChannel | DMChannel;
  public author: User;

  public constructor(public util: CommandUtil) {
    this.handler = util.handler;
  }

  public _fix(message: Message): void {
    this.message = message;
    this.guild = message.guild;
    this.member = message.member;
    this.channel = message.channel as any;
    this.author = message.author;
  }

  public get voiceState(): VoiceState {
    return this.member ? this.member.voice : null;
  }

  public get vc(): VoiceChannel {
    return this.voiceState ? this.voiceState.channel : null;
  }
}