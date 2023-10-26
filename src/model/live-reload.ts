import { thunk, Thunk } from "easy-peasy";
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
  maybeConnect: Thunk<IReloadServer, void, void, IPytchAppModel>;
}

export const reloadServer: IReloadServer = {
  webSocket: null,

  maybeConnect: thunk((_actions, _voidPayload, helpers) => {
    if (!isEnabled()) return;

    // In general it's a bad idea to mutate state within a thunk, but we
    // want to ensure we assign to the event handlers of the WebSocket
    // straight away.

    let state = helpers.getState();
    if (state.webSocket == null) {
      const { handleLiveReloadMessage, handleLiveReloadError } =
        helpers.getStoreActions().activeProject;

      state.webSocket = new WebSocket(liveReloadURL);
      state.webSocket.onerror = () => handleLiveReloadError();
      state.webSocket.onmessage = (evt) => handleLiveReloadMessage(evt.data);
    }
  }),
};
