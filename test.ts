import "./index.d.ts"
import { AkairoClient } from "@kyflx-dev/akairo"

AkairoClient.prototype.logger

declare module "@kyflx-dev/akairo" {
  interface AkairoClient {
    logger: string;
  }
}