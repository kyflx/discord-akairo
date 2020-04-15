import { AkairoModule, AkairoModuleOptions } from "../AkairoModule";
import { EventEmitter } from "events";
import { ListenerHandler } from "./ListenerHandler";
import { AkairoError } from "../../util";

export type ListenerType = "on" | "once" | "off";
export interface ListenerOptions extends AkairoModuleOptions {
  emitter: string | EventEmitter;
  event: string;
  type?: ListenerType;
}

export class Listener extends AkairoModule {
  public emitter: string | EventEmitter;
  public event: string;
  public type: ListenerType;
  public handler: ListenerHandler;

  public constructor(
    id: string,
    {
      category,
      emitter,
      event,
      type = "on",
    }: ListenerOptions = {} as ListenerOptions
  ) {
    super(id, { category });
    this.emitter = emitter;
    this.event = event;
    this.type = type;
  }

  public exec() {
    throw new AkairoError("NOT_IMPLEMENTED", this.constructor.name, "exec");
  }
}
