import { thunk, Thunk } from "easy-peasy";
import { IPytchAppModel } from ".";
import { liveReloadEnabled, liveReloadURL } from "../constants";

export interface IReloadServer {
  webSocket: WebSocket | null;
  maybeConnect: Thunk<IReloadServer, void, any, IPytchAppModel>;
}

export const reloadServer: IReloadServer = {
  webSocket: null,

  maybeConnect: thunk((_actions, _voidPayload, helpers) => {
    if (!liveReloadEnabled) return;

    // In general it's a bad idea to mutate state within a thunk, but we
    // want to ensure we assign to the event handlers of the WebSocket
    // straight away.

    let state = helpers.getState();
    if (state.webSocket == null) {
      const {
        handleLiveReloadMessage,
        handleLiveReloadError,
      } = helpers.getStoreActions().activeProject;

      state.webSocket = new WebSocket(liveReloadURL);
      state.webSocket.onerror = () => handleLiveReloadError();
      state.webSocket.onmessage = (event) => handleLiveReloadMessage(event.data);
    }
  }),
};
