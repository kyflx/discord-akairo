import { Client, ClientOptions, UserResolvable } from "discord.js";
import { ClientUtil } from "./ClientUtil";

export interface AkairoOptions {
  ownerID?: string | string[];
}

export class AkairoClient extends Client {
  public util: ClientUtil = new ClientUtil(this);
  public ownerID: string | string[];

  public constructor(options: AkairoOptions & ClientOptions = {}) {
    super(options);
    this.ownerID = options.ownerID ?? "";
  }

  public isOwner(user: UserResolvable): boolean {
    const id = this.users.resolveID(user);
    return Array.isArray(this.ownerID)
      ? this.ownerID.includes(id)
      : id === this.ownerID;
  }
}
