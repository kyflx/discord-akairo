import { Collection } from "discord.js";

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
