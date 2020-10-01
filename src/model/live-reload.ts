import { thunk, Thunk } from "easy-peasy";
import { IPytchAppModel } from ".";

export interface IReloadServer {
  webSocket: WebSocket | null;
  maybeConnect: Thunk<IReloadServer, void, any, IPytchAppModel>;
}
