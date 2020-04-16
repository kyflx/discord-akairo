import { Collection } from "discord.js";
import { AkairoModule } from "../struct/AkairoModule";

export class Category<T extends AkairoModule> extends Collection<string, T> {
  public constructor(
    public id: string,
    iterable?: readonly (readonly [string, T])[]
  ) {
    super(iterable);
  }

  public reloadAll() {
    for (const m of Array.from(this.values())) {
      if (m.filepath) {
        m.reload();
      }
    }

    return this;
  }

  public removeAll() {
    for (const m of Array.from(this.values())) {
      if (m.filepath) {
        m.remove();
      }
    }

    return this;
  }

  public toString() {
    return this.id;
  }
}
