import { action, Action, thunk, Thunk } from "easy-peasy";
import { IPytchAppModel } from ".";
import { envVarOrDefault } from "../env-utils";

export const isEnabled = () =>
  envVarOrDefault("VITE_LIVE_RELOAD_WEBSOCKET", "no") === "yes";

export const liveReloadURL = "ws://127.0.0.1:4111/";

// This is functionality for developers, so don't bother with retrying
// the connection.  We will log a message if we hit an error, though, so
// they can at least be prompted to make sure they're running the local
// watch server.

type ReloadCallbacks = {
  onerror(ev: Event): null;
  onmessage(ev: MessageEvent): null;
};

export interface IReloadServer {
  webSocket: WebSocket | null;
  connect: Action<IReloadServer, ReloadCallbacks>;
  maybeConnect: Thunk<IReloadServer, void, void, IPytchAppModel>;
}

export const reloadServer: IReloadServer = {
  webSocket: null,

  connect: action((state, callbacks) => {
    if (state.webSocket != null) {
      return;
    }

    let ws = new WebSocket(liveReloadURL);
    ws.onerror = callbacks.onerror;
    ws.onmessage = callbacks.onmessage;
    state.webSocket = ws;
  }),

  maybeConnect: thunk((actions, _voidPayload, helpers) => {
    if (!isEnabled()) return;

    const { handleLiveReloadMessage, handleLiveReloadError } =
      helpers.getStoreActions().activeProject;

    const callbacks: ReloadCallbacks = {
      onerror: () => handleLiveReloadError(),
      onmessage: (ev) => handleLiveReloadMessage(ev.data),
    };

    actions.connect(callbacks);
  }),
};
