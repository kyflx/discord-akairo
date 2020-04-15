import { Snowflake, Client, ClientOptions, UserResolvable } from "discord.js";
import { ClientUtil } from "./ClientUtil";

export interface AkairoOptions {
  ownerID?: Snowflake | Snowflake[];
}

export class AkairoClient extends Client {
  public util: ClientUtil = new ClientUtil(this);
  public ownerID: Snowflake | Snowflake[];

  constructor(options: AkairoOptions & ClientOptions = {}) {
    super(options);
    const { ownerID = "" } = options;
    this.ownerID = ownerID;
  }

  public isOwner(user: UserResolvable): boolean {
    const id = this.users.resolveID(user);
    return Array.isArray(this.ownerID)
      ? this.ownerID.includes(id)
      : id === this.ownerID;
  }
}
