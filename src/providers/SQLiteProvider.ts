import { Database } from "sqlite";
import { Provider, SQLProviderOptions } from "./Provider";

export class SQLiteProvider<T extends any> extends Provider<T> {
  #db: Database;

  public idColumn: string;
  public dataColumn: string;

  public constructor(
    db: Database | Promise<Database>,
    public tableName: string,
    { idColumn = "id", dataColumn }: SQLProviderOptions = {}
  ) {
    super();
    this.#db = db as Database;
    this.idColumn = idColumn;
    this.dataColumn = dataColumn;
  }

  public async init(): Promise<void> {
    const db = await this.#db;
    this.#db = db;

    const rows = await this.#db.all(`SELECT * FROM ${this.tableName}`);
    for (const row of rows) {
      this.items.set(
        row[this.idColumn],
        this.dataColumn ? JSON.parse(row[this.dataColumn]) : row
      );
    }
  }

  public get<V>(id: string, key: string, defaultValue: V): V {
    const item = this.items.get(id) as any;
    return item ? item[key] ?? defaultValue : defaultValue;
  }

  public set(id: string, key: string, value: any) {
    const data = this.items.get(id) || ({} as T);
    const exists = this.items.has(id);

    data[key] = value;
    this.items.set(id, data);

    if (this.dataColumn) {
      return this.#db.run(
        exists
          ? `UPDATE ${this.tableName} SET ${this.dataColumn} = $value WHERE ${this.idColumn} = $id`
          : `INSERT INTO ${this.tableName} (${this.idColumn}, ${this.dataColumn}) VALUES ($id, $value)`,
        {
          $id: id,
          $value: JSON.stringify(data),
        }
      );
    }

    return this.#db.run(
      exists
        ? `UPDATE ${this.tableName} SET ${key} = $value WHERE ${this.idColumn} = $id`
        : `INSERT INTO ${this.tableName} (${this.idColumn}, ${key}) VALUES ($id, $value)`,
      {
        $id: id,
        $value: value,
      }
    );
  }

  public delete(id: string, key: string) {
    const data = this.items.get(id) || ({} as T);
    delete data[key];

    if (this.dataColumn) {
      return this.#db.run(
        `UPDATE ${this.tableName} SET ${this.dataColumn} = $value WHERE ${this.idColumn} = $id`,
        {
          $id: id,
          $value: JSON.stringify(data),
        }
      );
    }

    return this.#db.run(
      `UPDATE ${this.tableName} SET ${key} = $value WHERE ${this.idColumn} = $id`,
      {
        $id: id,
        $value: null,
      }
    );
  }

  public clear(id: string) {
    this.items.delete(id);
    return this.#db.run(
      `DELETE FROM ${this.tableName} WHERE ${this.idColumn} = $id`,
      { $id: id }
    );
  }
}
