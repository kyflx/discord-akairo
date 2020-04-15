# @kyflx/akairo

This is basically just a fork of [discord-akairo](https://github.com/discord-akairo/discord-akairo) but It's in [Typescript](https://www.typescriptlang.org) and it uses CommandContext for prompts and shit.

## Customizatiom

The only customizable class as of right now is `CommandContext`

```ts
import { Structures } from "@kyflx/akairo";

Structures.extend(
  "CommandContext",
  (BaseContext) =>
    class KyflxContext extends BaseContext {
      public get lol() {
        return "lol";
      }
    }
);

declare module "@kyflx/akairo" {
  interface CommandContext {
    lol: string;
  }
}

```

## Installation

We do **not** provide support for this package as it was made for Kyflx.

```bash
$ npm install @kyflx/akairo
```
