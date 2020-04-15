import { Collection } from "discord.js";
import { AkairoModule } from "../struct/AkairoModule";

/**
 * A group of modules.
 * @param {string} id - ID of the category.
 * @param {Iterable} [iterable] - Entries to set.
 * @extends {Collection}
 */
export class Category<T extends AkairoModule> extends Collection<string, T> {
  public constructor(
    public id: string,
    iterable?: readonly (readonly [string, T])[]
  ) {
    super(iterable);
  }

  /**
   * Calls `reload()` on all items in this category.
   * @returns {Category}
   */
  public reloadAll() {
    for (const m of Array.from(this.values())) {
      if (m.filepath) {
        m.reload();
      }
    }

    return this;
  }

  /**
   * Calls `remove()` on all items in this category.
   * @returns {Category}
   */
  public removeAll() {
    for (const m of Array.from(this.values())) {
      if (m.filepath) {
        m.remove();
      }
    }

    return this;
  }

  /**
   * Returns the ID.
   * @returns {string}
   */
  public toString() {
    return this.id;
  }
}
