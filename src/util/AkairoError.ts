const Messages: Record<string, string | Function> = {
  // Module-related
  FILE_NOT_FOUND: (filename: string) => `File '${filename}' not found`,
  MODULE_NOT_FOUND: (constructor: any, id: string) =>
    `${constructor} '${id}' does not exist`,
  ALREADY_LOADED: (constructor: any, id: string) =>
    `${constructor} '${id}' is already loaded`,
  NOT_RELOADABLE: (constructor: any, id: string) =>
    `${constructor} '${id}' is not reloadable`,
  INVALID_CLASS_TO_HANDLE: (given: any, expected: any) =>
    `Class to handle ${given} is not a subclass of ${expected}`,

  // Command-related
  ALIAS_CONFLICT: (alias: string, id: string, conflict: any) =>
    `Alias '${alias}' of '${id}' already exists on '${conflict}'`,

  // Options-related
  COMMAND_UTIL_EXPLICIT:
    "The command handler options `handleEdits` and `storeMessages` require the `commandUtil` option to be true",
  UNKNOWN_MATCH_TYPE: (match: string) => `Unknown match type '${match}'`,

  // Generic errors
  NOT_INSTANTIABLE: (constructor: any) => `${constructor} is not instantiable`,
  NOT_IMPLEMENTED: (constructor: any, method: string) =>
    `${constructor}#${method} has not been implemented`,
  INVALID_TYPE: (name: string, expected: string, vowel = false) =>
    `Value of '${name}' was not ${vowel ? "an" : "a"} ${expected}`,
};

export class AkairoError extends Error {
  public code: string;
  constructor(key: string, ...args: any[]) {
    if (Messages[key] == null)
      throw new TypeError(`Error key '${key}' does not exist`);
    const message =
      typeof Messages[key] === "function"
        ? (Messages[key] as Function).call(null, args)
        : Messages[key];

    super(message);

    this.code = key;
  }

  public get name() {
    return `AkairoError [${this.code}]`;
  }
}
