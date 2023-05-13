import { Action, Thunk, thunk } from "easy-peasy";
import { propSetterAction } from "../utils";
import { bootApi } from "../storage/google-drive";

type ApiBootStatus =
  | { kind: "not-yet-started" }
  | { kind: "pending" }
  | { kind: "succeeded"; api: GoogleDriveApi }
  | { kind: "failed" };

export type GoogleDriveIntegration = {
  apiBootStatus: ApiBootStatus;
  setApiBootStatus: Action<GoogleDriveIntegration, ApiBootStatus>;

  maybeBoot: Thunk<GoogleDriveIntegration>;
};

export let googleDriveIntegration: GoogleDriveIntegration = {
  apiBootStatus: { kind: "not-yet-started" },
  setApiBootStatus: propSetterAction("apiBootStatus"),

  maybeBoot: thunk(async (actions, _voidPayload, helpers) => {
    const state = helpers.getState();
    if (state.apiBootStatus.kind !== "not-yet-started") {
      return;
    }

    try {
      actions.setApiBootStatus({ kind: "pending" });
      const api = await bootApi().boot();
      actions.setApiBootStatus({ kind: "succeeded", api });
    } catch (err) {
      // TODO: Any useful way to report this to user?
      console.error("GoogleDriveIntegration.maybeBoot(): boot failed", err);
      actions.setApiBootStatus({ kind: "failed" });
    }
  }),
};
