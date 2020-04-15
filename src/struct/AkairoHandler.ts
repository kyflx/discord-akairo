import { Collection } from "discord.js";
import { EventEmitter } from "events";
import { readdirSync, statSync } from "fs";
import { dirname, extname, join, resolve, sep } from "path";
import { AkairoHandlerEvents, Category } from "..";
import { AkairoClient } from "./AkairoClient";
import { AkairoModule } from "./AkairoModule";
import { AkairoError } from "../util";

export type LoadPredicate = (filepath: string) => boolean;
export interface AkairoHandlerOptions {
  automateCategories?: boolean;
  classToHandle?: Function;
  directory?: string;
  extensions?: string[] | Set<string>;
  loadFilter?: LoadPredicate;
}

export class AkairoHandler<T extends AkairoModule> extends EventEmitter {
  public client: AkairoClient;
  public directory?: string;
  public classToHandle: Function;
  public extensions: Set<string>;
  public automateCategories: boolean;
  public loadFilter: LoadPredicate;

  public modules: Collection<string, T> = new Collection();
  public categories: Collection<string, Category<T>> = new Collection();

  constructor(
    client: AkairoClient,
    {
      directory,
      classToHandle = AkairoModule,
      extensions = [".js", ".json", ".ts"],
      automateCategories = false,
      loadFilter = () => true,
    }: AkairoHandlerOptions = {}
  ) {
    super();

    this.client = client;
    this.directory = directory;
    this.classToHandle = classToHandle;
    this.extensions = new Set(extensions);
    this.automateCategories = Boolean(automateCategories);
    this.loadFilter = loadFilter;
  }

  public register(mod: T, filepath: string): void {
    mod.filepath = filepath;
    mod.client = this.client;
    mod.handler = this;
    this.modules.set(mod.id, mod);

    if (mod.categoryID === "default" && this.automateCategories) {
      const dirs = dirname(filepath).split(sep);
      mod.categoryID = dirs[dirs.length - 1];
    }

    if (!this.categories.has(mod.categoryID)) {
      this.categories.set(mod.categoryID, new Category(mod.categoryID));
    }

    const category = this.categories.get(mod.categoryID);
    mod.category = category;
    category!.set(mod.id, mod);
  }

  public deregister(mod: T): void {
    if (mod.filepath) delete require.cache[require.resolve(mod.filepath)];
    this.modules.delete(mod.id);
    mod.category!.delete(mod.id);
  }

  public load(thing: string | Function, isReload = false): T | undefined {
    const isClass = typeof thing === "function";
    if (!isClass && !this.extensions.has(extname(thing as string)))
      return undefined;

    let mod = isClass
      ? thing
      : function findExport(m: any): any {
          if (!m) return null;
          // @ts-ignore
          if (m.prototype instanceof this.classToHandle) return m;
          // @ts-ignore
          return m.default ? findExport.call(this, m.default) : null;
        }.call(this, require(thing as string));

    if (mod && mod.prototype instanceof this.classToHandle) {
      mod = new mod(this);
    } else {
      if (!isClass) delete require.cache[require.resolve(thing as string)];
      return undefined;
    }

    if (this.modules.has(mod.id))
      throw new AkairoError("ALREADY_LOADED", this.classToHandle.name, mod.id);

    this.register(mod, (isClass ? null : thing) as string);
    this.emit(AkairoHandlerEvents.LOAD, mod, isReload);
    return mod;
  }

  public loadAll(
    directory: string = this.directory,
    filter: LoadPredicate = this.loadFilter || (() => true)
  ) {
    const filepaths = AkairoHandler.readdirRecursive(directory);
    for (let filepath of filepaths) {
      filepath = resolve(filepath);
      if (filter(filepath)) this.load(filepath);
    }

    return this;
  }

  public remove(id: string) {
    const mod = this.modules.get(id.toString());
    if (!mod)
      throw new AkairoError("MODULE_NOT_FOUND", this.classToHandle.name, id);

    this.deregister(mod);

    this.emit(AkairoHandlerEvents.REMOVE, mod);
  }

  public removeAll() {
    for (const m of Array.from(this.modules.values())) {
      if (m.filepath) this.remove(m.id);
    }

    return this;
  }

  public reload(id: string): T {
    const mod = this.modules.get(id.toString());
    if (!mod)
      throw new AkairoError("MODULE_NOT_FOUND", this.classToHandle.name, id);
    if (!mod.filepath)
      throw new AkairoError("NOT_RELOADABLE", this.classToHandle.name, id);

    this.deregister(mod);

    const filepath = mod.filepath;
    const newMod = this.load(filepath, true);
    return newMod;
  }

  public reloadAll() {
    for (const m of Array.from(this.modules.values())) {
      if (m.filepath) this.reload(m.id);
    }

    return this;
  }

  public findCategory(name: string): Category<T> {
    return this.categories.find((category) => {
      return category.id.toLowerCase() === name.toLowerCase();
    });
  }

  static readdirRecursive(directory: string): string[] {
    const result = [];

    (function read(dir) {
      const files = readdirSync(dir);

      for (const file of files) {
        const filepath = join(dir, file);

        if (statSync(filepath).isDirectory()) {
          read(filepath);
        } else {
          result.push(filepath);
        }
      }
    })(directory);

    return result;
  }
}
