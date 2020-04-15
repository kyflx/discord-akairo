import AkairoClient from "../AkairoClient";
import { Listener } from "./Listener";
import { AkairoHandler, AkairoHandlerOptions } from "../AkairoHandler";
import { Collection } from "discord.js";
import { EventEmitter } from "events";
import { Util, AkairoError } from "../../util";

export class ListenerHandler extends AkairoHandler<Listener> {
  public emitters: Collection<string, EventEmitter> = new Collection();

  public constructor(
    client: AkairoClient,
    {
      directory,
      classToHandle = Listener,
      extensions = [".js", ".ts"],
      automateCategories,
      loadFilter,
    }: AkairoHandlerOptions = {}
  ) {
    super(client, {
      directory,
      classToHandle,
      extensions,
      automateCategories,
      loadFilter,
    });

    this.emitters.set("client", this.client);
  }

  public register(listener: Listener, filepath: string): Listener {
    super.register(listener, filepath);
    listener.exec = listener.exec.bind(listener);
    this.addToEmitter(listener.id);
    return listener;
  }

  public deregister(listener: Listener): void {
    this.removeFromEmitter(listener.id);
    super.deregister(listener);
  }

  public addToEmitter(id: string): Listener {
    const listener = this.modules.get(id.toString());
    if (!listener)
      throw new AkairoError("MODULE_NOT_FOUND", this.classToHandle.name, id);

    const emitter: EventEmitter =
      listener.emitter instanceof EventEmitter
        ? listener.emitter
        : this.emitters.get(listener.emitter as string);
    if (!Util.isEventEmitter(emitter))
      throw new AkairoError("INVALID_TYPE", "emitter", "EventEmitter", true);

    emitter[listener.type](listener.event, listener.exec.bind(listener));
    return listener;
  }

  public removeFromEmitter(id: string): Listener {
    const listener = this.modules.get(id.toString());
    if (!listener)
      throw new AkairoError("MODULE_NOT_FOUND", this.classToHandle.name, id);

    const emitter = Util.isEventEmitter(listener.emitter)
      ? listener.emitter
      : this.emitters.get(listener.emitter as string);
    if (!Util.isEventEmitter(emitter))
      throw new AkairoError("INVALID_TYPE", "emitter", "EventEmitter", true);

    (emitter as EventEmitter).removeListener(listener.event, listener.exec);
    return listener;
  }

  public setEmitters(emitters: Record<string, EventEmitter>): this {
    for (const [key, value] of Object.entries(emitters)) {
      if (!Util.isEventEmitter(value))
        throw new AkairoError("INVALID_TYPE", key, "EventEmitter", true);
      this.emitters.set(key, value);
    }

    return this;
  }
}
