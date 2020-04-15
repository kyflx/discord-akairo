import { Provider, SQLProviderOptions } from "./Provider";

export class SequelizeProvider<T extends any> extends Provider<T> {
  public idColumn: string;
  public dataColumn: string;

  constructor(
    public table: any,
    { idColumn = "id", dataColumn }: SQLProviderOptions = {}
  ) {
    super();
    this.idColumn = idColumn;
    this.dataColumn = dataColumn;
  }

  public async init(): Promise<void> {
    const rows = await this.table.findAll();
    for (const row of rows) {
      this.items.set(
        row[this.idColumn],
        this.dataColumn ? row[this.dataColumn] : row
      );
    }
  }

  public get<V>(id: string, key: string, defaultValue: V): V {
    const item = this.items.get(id) as any;
    return item ? item[key] ?? defaultValue : defaultValue;
  }

  public set(id: string, key: string, value: any): Promise<boolean> {
    const data = this.items.get(id);
    data[key] = value;
    this.items.set(id, data);

    if (this.dataColumn) {
      return this.table.upsert({
        [this.idColumn]: id,
        [this.dataColumn]: data,
      });
    }

    return this.table.upsert({
      [this.idColumn]: id,
      [key]: value,
    });
  }

  public delete(id: string, key: string): Promise<boolean> {
    const data = this.items.get(id) || ({} as T);
    delete data[key];

    if (this.dataColumn) {
      return this.table.upsert({
        [this.idColumn]: id,
        [this.dataColumn]: data,
      });
    }

    return this.table.upsert({
      [this.idColumn]: id,
      [key]: null,
    });
  }

  public clear(id: string): Promise<boolean> {
    this.items.delete(id);
    return this.table.destroy({ where: { [this.idColumn]: id } });
  }
}

module.exports = SequelizeProvider;
