import { CommandContext } from "./commands";

export * from "./commands";
export * from "./inhibitors";
export * from "./listeners";
export * from "./AkairoClient";
export * from "./AkairoHandler";
export * from "./AkairoModule";
export * from "./ClientUtil";

interface Extandables {
  CommandContext: typeof CommandContext;
}

const structures: Extandables = { CommandContext };

export abstract class Structures {
  private constructor() {
    throw new Error(
      `The ${this.constructor.name} class may not be instantiated.`
    );
  }

  static get<K extends keyof Extandables>(structure: K): Extandables[K] {
    if (typeof structure === "string") return structures[structure];
    throw new TypeError(
      `"structure" argument must be a string (received ${typeof structure})`
    );
  }

  static extend<K extends keyof Extandables, T extends Extandables[K]>(
    structure: K,
    extender: (base: Extandables[K]) => T
  ): T {
    if (!structures[structure])
      throw new RangeError(
        `"${structure}" is not a valid extensible structure.`
      );
    if (typeof extender !== "function") {
      const received = `(received ${typeof extender})`;
      throw new TypeError(
        `"extender" argument must be a function that returns the extended structure class/prototype ${received}.`
      );
    }

    const extended = extender(structures[structure]);
    if (typeof extended !== "function") {
      const received = `(received ${typeof extended})`;
      throw new TypeError(
        `The extender function must return the extended structure class/prototype ${received}.`
      );
    }

    if (!(extended.prototype instanceof structures[structure])) {
      const prototype = Object.getPrototypeOf(extended);
      const received = `${extended.name || "unnamed"}${
        prototype.name ? ` extends ${prototype.name}` : ""
      }`;
      throw new Error(
        "The class/prototype returned from the extender function must extend the existing structure class/prototype" +
          ` (received function ${received}; expected extension of ${structures[structure].name}).`
      );
    }

    structures[structure] = extended;
    return extended;
  }
}
