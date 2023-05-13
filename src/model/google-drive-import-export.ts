import { Action, Thunk, thunk } from "easy-peasy";
import { assertNever, propSetterAction } from "../utils";
import { bootApi } from "../storage/google-drive";

type ApiBootStatus =
  | { kind: "not-yet-started" }
  | { kind: "pending" }
  | { kind: "succeeded"; api: GoogleDriveApi }
  | { kind: "failed" };

// There is no such state as "failed".  Instead, an authentication
// failure becomes a task failure, and we drop back to "idle" to allow
// another attempt later.
type AuthenticationState =
  | { kind: "idle" }
  | { kind: "pending"; abortController: AbortController }
  | { kind: "succeeded"; tokenInfo: TokenInfo };

type TaskOutcome = {
  successes: Array<string>;
  failures: Array<string>;
};

type TaskState =
  | { kind: "idle" }
  | { kind: "pending"; summary: string }
  | { kind: "pending-already-modal" }
  | { kind: "done"; summary: string; outcome: TaskOutcome };

type GoogleDriveTask = (
  api: GoogleDriveApi,
  tokenInfo: TokenInfo
) => Promise<TaskOutcome>;

type TaskDescriptor = {
  summary: string;
  run: GoogleDriveTask;
};

export type GoogleDriveIntegration = {
  apiBootStatus: ApiBootStatus;
  setApiBootStatus: Action<GoogleDriveIntegration, ApiBootStatus>;

  authState: AuthenticationState;
  setAuthState: Action<GoogleDriveIntegration, AuthenticationState>;

  taskState: TaskState;
  setTaskState: Action<GoogleDriveIntegration, TaskState>;

  maybeBoot: Thunk<GoogleDriveIntegration>;

  requireBooted: Thunk<
    GoogleDriveIntegration,
    void,
    any,
    IPytchAppModel,
    GoogleDriveApi
  >;
  ensureAuthenticated: Thunk<
    GoogleDriveIntegration,
    void,
    any,
    IPytchAppModel,
    Promise<TokenInfo>
  >;
};

export let googleDriveIntegration: GoogleDriveIntegration = {
  apiBootStatus: { kind: "not-yet-started" },
  setApiBootStatus: propSetterAction("apiBootStatus"),

  authState: { kind: "idle" },
  setAuthState: propSetterAction("authState"),

  taskState: { kind: "idle" },
  setTaskState: propSetterAction("taskState"),

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

  requireBooted: thunk((_actions, _voidPayload, helpers) => {
    const apiBootStatus = helpers.getState().apiBootStatus;
    if (apiBootStatus.kind !== "succeeded")
      throw new Error(
        `ensureAuthenticated(): bad api boot status "${apiBootStatus.kind}"`
      );

    return apiBootStatus.api;
  }),

  ensureAuthenticated: thunk(async (actions, _voidPayload, helpers) => {
    const api = actions.requireBooted();
    const authState = helpers.getState().authState;

    switch (authState.kind) {
      case "pending":
        throw new Error(`ensureAuthenticated(): bad state "pending"`);
      case "succeeded":
        return authState.tokenInfo;
      case "idle":
        const abortController = new AbortController();
        actions.setAuthState({ kind: "pending", abortController });
        const signal = abortController.signal;
        const tokenInfo = await api.acquireToken({ signal });
        actions.setAuthState({ kind: "succeeded", tokenInfo });
        return tokenInfo;
      default:
        return assertNever(authState);
    }
  }),
};
