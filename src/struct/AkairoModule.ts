import { AkairoHandler } from "./AkairoHandler";
import { AkairoClient } from "./AkairoClient";
import { Category } from "../util";

export interface AkairoModuleOptions {
  category?: string;
}

export abstract class AkairoModule {
  public id: string;
  public categoryID: string;
  public filepath?: string;

  public category?: Category<AkairoModule>;
  public client: AkairoClient;
  public handler: AkairoHandler<AkairoModule>;

  public constructor(
    id: string,
    { category = "default" }: AkairoModuleOptions = {}
  ) {
    this.id = id;
    this.categoryID = category;
  }

  public reload() {
    return this.handler.reload(this.id);
  }

  public remove() {
    return this.handler.remove(this.id);
  }

  public toString() {
    return this.id;
  }
}
