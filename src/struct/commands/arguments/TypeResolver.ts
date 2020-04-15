//@ts-nocheck
import { Collection, GuildMember } from "discord.js";
import { ArgumentTypes } from "../../../util";
import AkairoClient from "../../AkairoClient";
import { Col } from "../../ClientUtil";
import { InhibitorHandler } from "../../inhibitors/InhibitorHandler";
import { ListenerHandler } from "../../listeners/ListenerHandler";
import { CommandHandler } from "../CommandHandler";
import { ArgumentTypeCaster } from "./Argument";

export class TypeResolver {
  public client: AkairoClient;
  public types: Collection<string, ArgumentTypeCaster> = new Collection();

  /* Handlers */
  public commandHandler: CommandHandler;
  public inhibitorHandler: InhibitorHandler;
  public listenerHandler: ListenerHandler;

  constructor(public handler: CommandHandler) {
    this.client = handler.client;

    this.commandHandler = handler;
    this.inhibitorHandler = null;
    this.listenerHandler = null;

    this.addBuiltInTypes();
  }

  public addBuiltInTypes(): void {
    const builtins = {
      [ArgumentTypes.STRING]: (ctx: any, phrase: string) => {
        return phrase || null;
      },

      [ArgumentTypes.LOWERCASE]: (ctx: any, phrase: string) => {
        return phrase ? phrase.toLowerCase() : null;
      },

      [ArgumentTypes.UPPERCASE]: (ctx: any, phrase: string) => {
        return phrase ? phrase.toUpperCase() : null;
      },

      [ArgumentTypes.CHAR_CODES]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        const codes = [];
        for (const char of phrase) codes.push(char.charCodeAt(0));
        return codes;
      },

      [ArgumentTypes.NUMBER]: (ctx: any, phrase: string) => {
        if (!phrase || isNaN(phrase)) return null;
        return parseFloat(phrase);
      },

      [ArgumentTypes.INTEGER]: (ctx: any, phrase: string) => {
        if (!phrase || isNaN(phrase)) return null;
        return parseInt(phrase);
      },

      [ArgumentTypes.BIGINT]: (ctx: any, phrase: string) => {
        if (!phrase || isNaN(phrase)) return null;
        return BigInt(phrase); // eslint-disable-line no-undef, new-cap
      },

      // Just for fun.
      [ArgumentTypes.EMOJINT]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        // @ts-ignore
        const n = phrase.replace(/0⃣|1⃣|2⃣|3⃣|4⃣|5⃣|6⃣|7⃣|8⃣|9⃣|🔟/g, (m) => {
          return [
            "0⃣",
            "1⃣",
            "2⃣",
            "3⃣",
            "4⃣",
            "5⃣",
            "6⃣",
            "7⃣",
            "8⃣",
            "9⃣",
            "🔟",
          ].indexOf(m);
        });

        if (isNaN(n)) return null;
        return parseInt(n);
      },

      [ArgumentTypes.URL]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        if (/^<.+>$/.test(phrase)) phrase = phrase.slice(1, -1);

        try {
          return new URL(phrase);
        } catch (err) {
          return null;
        }
      },

      [ArgumentTypes.DATE]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        const timestamp = Date.parse(phrase);
        if (isNaN(timestamp)) return null;
        return new Date(timestamp);
      },

      [ArgumentTypes.COLOR]: (ctx: any, phrase: string) => {
        if (!phrase) return null;

        const color = parseInt(phrase.replace("#", ""), 16);
        if (color < 0 || color > 0xffffff || isNaN(color)) {
          return null;
        }

        return color;
      },

      [ArgumentTypes.USER]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        return this.client.util.resolveUser(phrase, this.client.users.cache);
      },

      [ArgumentTypes.USERS]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        const users = this.client.util.resolveUsers(
          phrase,
          this.client.users.cache
        );
        return users.size ? users : null;
      },

      [ArgumentTypes.MEMBER]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        return this.client.util.resolveMember(phrase, ctx.guild.members.cache);
      },

      [ArgumentTypes.MEMBERS]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        const members = this.client.util.resolveMembers(
          phrase,
          ctx.guild.members.cache
        );
        return members.size ? members : null;
      },

      [ArgumentTypes.RELEVANT]: (ctx: any, phrase: string) => {
        if (!phrase) return null;

        const person =
          ctx.channel.type === "text"
            ? this.client.util.resolveMember(phrase, ctx.guild.members.cache)
            : ctx.channel.type === "dm"
            ? this.client.util.resolveUser(
                phrase,
                new Collection([
                  [ctx.channel.recipient.id, ctx.channel.recipient],
                  [this.client.user.id, this.client.user],
                ])
              )
            : this.client.util.resolveUser(
                phrase,
                new Collection([
                  [this.client.user.id, this.client.user],
                ]).concat(ctx.channel.recipients)
              );

        if (!person) return null;
        if (ctx.channel.type === "text") return (person as GuildMember).user;
        return person;
      },

      [ArgumentTypes.RELEVANTS]: (ctx: any, phrase: string) => {
        if (!phrase) return null;

        const persons =
          ctx.channel.type === "text"
            ? this.client.util.resolveMembers(phrase, ctx.guild.members.cache)
            : ctx.channel.type === "dm"
            ? this.client.util.resolveUsers(
                phrase,
                new Collection([
                  [ctx.channel.recipient.id, ctx.channel.recipient],
                  [this.client.user.id, this.client.user],
                ])
              )
            : this.client.util.resolveUsers(
                phrase,
                new Collection([
                  [this.client.user.id, this.client.user],
                ]).concat(ctx.channel.recipients)
              );

        if (!persons.size) return null;

        if (ctx.channel.type === "text") {
          return (persons as Col<GuildMember>).map((member) => member.user);
        }

        return persons;
      },

      [ArgumentTypes.CHANNEL]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        return this.client.util.resolveChannel(
          phrase,
          ctx.guild.channels.cache
        );
      },

      [ArgumentTypes.CHANNELS]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        const channels = this.client.util.resolveChannels(
          phrase,
          ctx.guild.channels.cache
        );
        return channels.size ? channels : null;
      },

      [ArgumentTypes.TEXT_CHANNEL]: (ctx: any, phrase: string) => {
        if (!phrase) return null;

        const channel = this.client.util.resolveChannel(
          phrase,
          ctx.guild.channels.cache
        );
        if (!channel || channel.type !== "text") return null;

        return channel;
      },

      [ArgumentTypes.TEXT_CHANNELS]: (ctx: any, phrase: string) => {
        if (!phrase) return null;

        const channels = this.client.util.resolveChannels(
          phrase,
          ctx.guild.channels.cache
        );
        if (!channels.size) return null;

        const textChannels = channels.filter((c) => c.type === "text");
        return textChannels.size ? textChannels : null;
      },

      [ArgumentTypes.VOICE_CHANNEL]: (ctx: any, phrase: string) => {
        if (!phrase) return null;

        const channel = this.client.util.resolveChannel(
          phrase,
          ctx.guild.channels.cache
        );
        if (!channel || channel.type !== "voice") return null;

        return channel;
      },

      [ArgumentTypes.VOICE_CHANNELS]: (ctx: any, phrase: string) => {
        if (!phrase) return null;

        const channels = this.client.util.resolveChannels(
          phrase,
          ctx.guild.channels.cache
        );
        if (!channels.size) return null;

        const voiceChannels = channels.filter((c) => c.type === "voice");
        return voiceChannels.size ? voiceChannels : null;
      },

      [ArgumentTypes.CATEGORY_CHANNEL]: (ctx: any, phrase: string) => {
        if (!phrase) return null;

        const channel = this.client.util.resolveChannel(
          phrase,
          ctx.guild.channels.cache
        );
        if (!channel || channel.type !== "category") return null;

        return channel;
      },

      [ArgumentTypes.CATEGORY_CHANNELS]: (ctx: any, phrase: string) => {
        if (!phrase) return null;

        const channels = this.client.util.resolveChannels(
          phrase,
          ctx.guild.channels.cache
        );
        if (!channels.size) return null;

        const categoryChannels = channels.filter((c) => c.type === "category");
        return categoryChannels.size ? categoryChannels : null;
      },

      [ArgumentTypes.NEWS_CHANNEL]: (ctx: any, phrase: string) => {
        if (!phrase) return null;

        const channel = this.client.util.resolveChannel(
          phrase,
          ctx.guild.channels.cache
        );
        if (!channel || channel.type !== "news") return null;

        return channel;
      },

      [ArgumentTypes.NEWS_CHANNELS]: (ctx: any, phrase: string) => {
        if (!phrase) return null;

        const channels = this.client.util.resolveChannels(
          phrase,
          ctx.guild.channels.cache
        );
        if (!channels.size) return null;

        const newsChannels = channels.filter((c) => c.type === "news");
        return newsChannels.size ? newsChannels : null;
      },

      [ArgumentTypes.STORE_CHANNEL]: (ctx: any, phrase: string) => {
        if (!phrase) return null;

        const channel = this.client.util.resolveChannel(
          phrase,
          ctx.guild.channels.cache
        );
        if (!channel || channel.type !== "store") return null;

        return channel;
      },

      [ArgumentTypes.STORE_CHANNELS]: (ctx: any, phrase: string) => {
        if (!phrase) return null;

        const channels = this.client.util.resolveChannels(
          phrase,
          ctx.guild.channels.cache
        );
        if (!channels.size) return null;

        const storeChannels = channels.filter((c) => c.type === "store");
        return storeChannels.size ? storeChannels : null;
      },

      [ArgumentTypes.ROLE]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        return this.client.util.resolveRole(phrase, ctx.guild.roles.cache);
      },

      [ArgumentTypes.ROLES]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        const roles = this.client.util.resolveRoles(
          phrase,
          ctx.guild.roles.cache
        );
        return roles.size ? roles : null;
      },

      [ArgumentTypes.EMOJI]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        return this.client.util.resolveEmoji(phrase, ctx.guild.emojis.cache);
      },

      [ArgumentTypes.EMOJIS]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        const emojis = this.client.util.resolveEmojis(
          phrase,
          ctx.guild.emojis.cache
        );
        return emojis.size ? emojis : null;
      },

      [ArgumentTypes.GUILD]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        return this.client.util.resolveGuild(phrase, this.client.guilds.cache);
      },

      [ArgumentTypes.GUILDS]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        const guilds = this.client.util.resolveGuilds(
          phrase,
          this.client.guilds.cache
        );
        return guilds.size ? guilds : null;
      },

      [ArgumentTypes.MESSAGE]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        return ctx.channel.messages.fetch(phrase).catch(() => null);
      },

      [ArgumentTypes.GUILD_MESSAGE]: async (ctx: any, phrase: string) => {
        if (!phrase) return null;
        for (const channel of ctx.guild.channels.cache.values()) {
          if (channel.type !== "text") continue;
          try {
            return await channel.messages.fetch(phrase);
          } catch (err) {
            if (/^Invalid Form Body/.test(err.message)) return null;
          }
        }

        return null;
      },

      [ArgumentTypes.RELEVANT_MESSAGE]: async (ctx: any, phrase: string) => {
        if (!phrase) return null;
        const hereMsg = await ctx.channel.messages
          .fetch(phrase)
          .catch(() => null);
        if (hereMsg) {
          return hereMsg;
        }

        if (ctx.guild) {
          for (const channel of ctx.guild.channels.cache.values()) {
            if (channel.type !== "text") continue;
            try {
              return await channel.messages.fetch(phrase);
            } catch (err) {
              if (/^Invalid Form Body/.test(err.message)) return null;
            }
          }
        }

        return null;
      },

      [ArgumentTypes.INVITE]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        return this.client.fetchInvite(phrase).catch(() => null);
      },

      [ArgumentTypes.USER_MENTION]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        const id = phrase.match(/<@!?(\d{17,19})>/);
        if (!id) return null;
        return this.client.users.cache.get(id[1]) || null;
      },

      [ArgumentTypes.MEMBER_MENTION]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        const id = phrase.match(/<@!?(\d{17,19})>/);
        if (!id) return null;
        return ctx.guild.members.cache.get(id[1]) || null;
      },

      [ArgumentTypes.CHANNEL_MENTION]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        const id = phrase.match(/<#(\d{17,19})>/);
        if (!id) return null;
        return ctx.guild.channels.cache.get(id[1]) || null;
      },

      [ArgumentTypes.ROLE_MENTION]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        const id = phrase.match(/<@&(\d{17,19})>/);
        if (!id) return null;
        return ctx.guild.roles.cache.get(id[1]) || null;
      },

      [ArgumentTypes.EMOJI_MENTION]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        const id = phrase.match(/<a?:[a-zA-Z0-9_]+:(\d{17,19})>/);
        if (!id) return null;
        return ctx.guild.emojis.cache.get(id[1]) || null;
      },

      [ArgumentTypes.COMMAND_ALIAS]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        return this.commandHandler.findCommand(phrase) || null;
      },

      [ArgumentTypes.COMMAND]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        return this.commandHandler.modules.get(phrase) || null;
      },

      [ArgumentTypes.INHIBITOR]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        return this.inhibitorHandler.modules.get(phrase) || null;
      },

      [ArgumentTypes.LISTENER]: (ctx: any, phrase: string) => {
        if (!phrase) return null;
        return this.listenerHandler.modules.get(phrase) || null;
      },
    };

    for (const [key, value] of Object.entries(builtins)) {
      this.types.set(key, value);
    }
  }

  public type(name: string): ArgumentTypeCaster {
    return this.types.get(name);
  }

  public addType(name: string, fn: ArgumentTypeCaster): TypeResolver {
    this.types.set(name, fn);
    return this;
  }

  public addTypes(types: Record<string, ArgumentTypeCaster>): TypeResolver {
    for (const [key, value] of Object.entries(types)) {
      this.addType(key, value);
    }

    return this;
  }
}
