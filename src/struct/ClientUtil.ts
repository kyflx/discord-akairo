import { AkairoClient } from "./AkairoClient";
import {
  Collection,
  User,
  GuildMember,
  TextChannel,
  VoiceChannel,
  Role,
  Emoji,
  Guild,
  Permissions,
  MessageAttachment,
  BufferResolvable,
} from "discord.js";
import { Stream } from "stream";

type Channel = TextChannel | VoiceChannel;
export type Col<T> = Collection<string, T>;
export class ClientUtil {
  constructor(public client: AkairoClient) {}

  public resolveUser(
    text: string,
    users: Col<User>,
    caseSensitive = false,
    wholeWord = false
  ): User {
    return (
      users.get(text) ||
      users.find((user) => this.checkUser(text, user, caseSensitive, wholeWord))
    );
  }

  public resolveUsers(
    text: string,
    users: Col<User>,
    caseSensitive = false,
    wholeWord = false
  ): Col<User> {
    return users.filter((user) =>
      this.checkUser(text, user, caseSensitive, wholeWord)
    );
  }

  public checkUser(
    text: string,
    user: User,
    caseSensitive = false,
    wholeWord = false
  ): boolean {
    if (user.id === text) return true;

    const reg = /<@!?(\d{17,19})>/;
    const match = text.match(reg);

    if (match && user.id === match[1]) return true;

    text = caseSensitive ? text : text.toLowerCase();
    const username = caseSensitive
      ? user.username
      : user.username.toLowerCase();
    const discrim = user.discriminator;

    if (!wholeWord) {
      return (
        username.includes(text) ||
        (username.includes(text.split("#")[0]) &&
          discrim.includes(text.split("#")[1]))
      );
    }

    return (
      username === text ||
      (username === text.split("#")[0] && discrim === text.split("#")[1])
    );
  }

  public resolveMember(
    text: string,
    members: Col<GuildMember>,
    caseSensitive = false,
    wholeWord = false
  ): GuildMember {
    return (
      members.get(text) ||
      members.find((member) =>
        this.checkMember(text, member, caseSensitive, wholeWord)
      )
    );
  }

  public resolveMembers(
    text: string,
    members: Col<GuildMember>,
    caseSensitive = false,
    wholeWord = false
  ): Col<GuildMember> {
    return members.filter((member) =>
      this.checkMember(text, member, caseSensitive, wholeWord)
    );
  }

  public checkMember(
    text: string,
    member: GuildMember,
    caseSensitive = false,
    wholeWord = false
  ): boolean {
    if (member.id === text) return true;

    const reg = /<@!?(\d{17,19})>/;
    const match = text.match(reg);

    if (match && member.id === match[1]) return true;

    text = caseSensitive ? text : text.toLowerCase();
    const username = caseSensitive
      ? member.user.username
      : member.user.username.toLowerCase();
    const displayName = caseSensitive
      ? member.displayName
      : member.displayName.toLowerCase();
    const discrim = member.user.discriminator;

    if (!wholeWord) {
      return (
        displayName.includes(text) ||
        username.includes(text) ||
        ((username.includes(text.split("#")[0]) ||
          displayName.includes(text.split("#")[0])) &&
          discrim.includes(text.split("#")[1]))
      );
    }

    return (
      displayName === text ||
      username === text ||
      ((username === text.split("#")[0] ||
        displayName === text.split("#")[0]) &&
        discrim === text.split("#")[1])
    );
  }

  public resolveChannel(
    text: string,
    channels: Col<Channel>,
    caseSensitive = false,
    wholeWord = false
  ): Channel {
    return (
      channels.get(text) ||
      channels.find((channel) =>
        this.checkChannel(text, channel, caseSensitive, wholeWord)
      )
    );
  }

  public resolveChannels(
    text: string,
    channels: Col<Channel>,
    caseSensitive = false,
    wholeWord = false
  ): Col<Channel> {
    return channels.filter((channel) =>
      this.checkChannel(text, channel, caseSensitive, wholeWord)
    );
  }

  public checkChannel(
    text: string,
    channel: Channel,
    caseSensitive = false,
    wholeWord = false
  ): boolean {
    if (channel.id === text) return true;

    const reg = /<#(\d{17,19})>/;
    const match = text.match(reg);

    if (match && channel.id === match[1]) return true;

    text = caseSensitive ? text : text.toLowerCase();
    const name = caseSensitive ? channel.name : channel.name.toLowerCase();

    if (!wholeWord) {
      return name.includes(text) || name.includes(text.replace(/^#/, ""));
    }

    return name === text || name === text.replace(/^#/, "");
  }

  public resolveRole(
    text: string,
    roles: Col<Role>,
    caseSensitive = false,
    wholeWord = false
  ): Role {
    return (
      roles.get(text) ||
      roles.find((role) => this.checkRole(text, role, caseSensitive, wholeWord))
    );
  }

  public resolveRoles(
    text: string,
    roles: Col<Role>,
    caseSensitive = false,
    wholeWord = false
  ): Col<Role> {
    return roles.filter((role) =>
      this.checkRole(text, role, caseSensitive, wholeWord)
    );
  }

  public checkRole(
    text: string,
    role: Role,
    caseSensitive = false,
    wholeWord = false
  ): boolean {
    if (role.id === text) return true;

    const reg = /<@&(\d{17,19})>/;
    const match = text.match(reg);

    if (match && role.id === match[1]) return true;

    text = caseSensitive ? text : text.toLowerCase();
    const name = caseSensitive ? role.name : role.name.toLowerCase();

    if (!wholeWord) {
      return name.includes(text) || name.includes(text.replace(/^@/, ""));
    }

    return name === text || name === text.replace(/^@/, "");
  }

  public resolveEmoji(
    text: string,
    emojis: Col<Emoji>,
    caseSensitive = false,
    wholeWord = false
  ): Emoji {
    return (
      emojis.get(text) ||
      emojis.find((emoji) =>
        this.checkEmoji(text, emoji, caseSensitive, wholeWord)
      )
    );
  }

  public resolveEmojis(
    text: string,
    emojis: Col<Emoji>,
    caseSensitive = false,
    wholeWord = false
  ): Col<Emoji> {
    return emojis.filter((emoji) =>
      this.checkEmoji(text, emoji, caseSensitive, wholeWord)
    );
  }

  public checkEmoji(
    text: string,
    emoji: Emoji,
    caseSensitive = false,
    wholeWord = false
  ): boolean {
    if (emoji.id === text) return true;

    const reg = /<a?:[a-zA-Z0-9_]+:(\d{17,19})>/;
    const match = text.match(reg);

    if (match && emoji.id === match[1]) return true;

    text = caseSensitive ? text : text.toLowerCase();
    const name = caseSensitive ? emoji.name : emoji.name.toLowerCase();

    if (!wholeWord) {
      return name.includes(text) || name.includes(text.replace(/:/, ""));
    }

    return name === text || name === text.replace(/:/, "");
  }

  public resolveGuild(
    text: string,
    guilds: Col<Guild>,
    caseSensitive = false,
    wholeWord = false
  ): Guild {
    return (
      guilds.get(text) ||
      guilds.find((guild) =>
        this.checkGuild(text, guild, caseSensitive, wholeWord)
      )
    );
  }

  public resolveGuilds(
    text: string,
    guilds: Col<Guild>,
    caseSensitive = false,
    wholeWord = false
  ): Col<Guild> {
    return guilds.filter((guild) =>
      this.checkGuild(text, guild, caseSensitive, wholeWord)
    );
  }

  public checkGuild(
    text: string,
    guild: Guild,
    caseSensitive = false,
    wholeWord = false
  ): boolean {
    if (guild.id === text) return true;

    text = caseSensitive ? text : text.toLowerCase();
    const name = caseSensitive ? guild.name : guild.name.toLowerCase();

    if (!wholeWord) return name.includes(text);
    return name === text;
  }

  public permissionNames() {
    return Object.keys(Permissions.FLAGS);
  }

  public resolvePermissionNumber(number: number): string[] {
    const resolved = [];

    for (const key of Object.keys(Permissions.FLAGS)) {
      // @ts-ignore
      if (number & Permissions.FLAGS[key]) resolved.push(key);
    }

    return resolved;
  }

  /**
   * Compares two member objects presences and checks if they stopped or started a stream or not.
   * Returns `0`, `1`, or `2` for no change, stopped, or started.
   */
  public compareStreaming(
    oldMember: GuildMember,
    newMember: GuildMember
  ): number {
    const s1 =
      oldMember.presence.activities[0] &&
      oldMember.presence.activities[0].type === "STREAMING";
    const s2 =
      newMember.presence.activities[0] &&
      newMember.presence.activities[0].type === "STREAMING";
    if (s1 === s2) return 0;
    if (s1) return 1;
    if (s2) return 2;
    return 0;
  }

  public async fetchMember(guild: Guild, id: string): Promise<GuildMember> {
    const user = await this.client.users.fetch(id);
    return guild.members.fetch(user);
  }

  public attachment(file: BufferResolvable | Stream, name?: string) {
    return new MessageAttachment(file, name);
  }
}

module.exports = ClientUtil;
