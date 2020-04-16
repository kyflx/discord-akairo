# @kyflx-dev/akairo

This is basically just a fork of [discord-akairo](https://github.com/discord-akairo/discord-akairo) but It's in [Typescript](https://www.typescriptlang.org) and it uses CommandContext for prompts and shit.

- [Kyflx Discord Server](https://discord.gg/BnQECNd)

## Caveats

If you for some reason want to use this in an already pretty large discord bot... don't lol, fork this and remove the command context stuff. But if you do here are some caveats:

- Said Context
  - You have to use a `CommandContext` class instead of a traditional discord.js `Message` class for commands and prompts.
  - `pre` and `post` type inhibitors use the `CommandContext`; whereas `all` uses the traditional `Message` class therefore typecasting ahaha... *don't yell at us*
- Typescript
  - Typescript is fucking weird... that's all for this point lol.
  - This is real buggy because some errors wouldn't occur in JavaScript so we had to do some weird type casting and rearranging.

if you find an issue please join our discord server: https://discord.gg/BnQECNd

## Customization

The only customizable class as of right now is `CommandContext`

```ts
import { Structures } from "@kyflx-dev/akairo";

Structures.extend(
  "CommandContext",
  (BaseContext) =>
    class KyflxContext extends BaseContext {
      public get lol() {
        return "lol";
      }
    }
);

declare module "@kyflx-dev/akairo" {
  interface CommandContext {
    lol: string;
  }
}

```

## Installation

We do **not** provide support for this package as it was made for Kyflx.

```bash
$ npm install @kyflx-dev/akairo
```
