import { AkairoHandler, AkairoHandlerOptions } from "../AkairoHandler";
import { Inhibitor, InhibitorType } from "./Inhibitor";
import { AkairoClient } from "../AkairoClient";
import { Message } from "discord.js";
import { AkairoError, Util } from "../../util";
import { Command } from "../commands/Command";

export class InhibitorHandler extends AkairoHandler<Inhibitor> {
  constructor(
    client: AkairoClient,
    {
      directory,
      classToHandle = Inhibitor,
      extensions = [".js", ".ts"],
      automateCategories,
      loadFilter,
    }: AkairoHandlerOptions = {}
  ) {
    if (
      !(
        classToHandle.prototype instanceof Inhibitor ||
        classToHandle === Inhibitor
      )
    ) {
      throw new AkairoError(
        "INVALID_CLASS_TO_HANDLE",
        classToHandle.name,
        Inhibitor.name
      );
    }

    super(client, {
      directory,
      classToHandle,
      extensions,
      automateCategories,
      loadFilter,
    });
  }

  /**
   * Tests inhibitors against the message.
   * Returns the reason if blocked.
   */
  public async test(
    type: InhibitorType,
    message: Message,
    command?: Command
  ): Promise<string | void> {
    if (!this.modules.size) return null;

    const inhibitors = this.modules.filter((i) => i.type === type);
    if (!inhibitors.size) return null;

    const promises = [];

    for (const inhibitor of inhibitors.values()) {
      promises.push(
        (async () => {
          let inhibited = inhibitor.exec(message, command);
          if (Util.isPromise(inhibited)) inhibited = await inhibited;
          if (inhibited) return inhibitor;
          return null;
        })()
      );
    }

    const inhibitedInhibitors = (await Promise.all(promises)).filter((r) => r);
    if (!inhibitedInhibitors.length) return null;

    inhibitedInhibitors.sort((a, b) => b.priority - a.priority);
    return inhibitedInhibitors[0].reason;
  }
}
