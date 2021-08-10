import { Action, action, Thunk, thunk } from "easy-peasy";
import {
  StudyCode,
  SessionToken,
  studyEnabled,
} from "../database/study-server";

type ScalarSessionState = {
  status:
    | "not-in-use"
    | "booting"
    | "validating-saved-session"
    | "no-valid-session"
    | "failed"
    | "signing-out"
    | "signed-out";
};

export type JoiningSessionState = {
  status: "joining";
  phase:
    | { status: "validating-study-code" }
    | { status: "invalid-study-code" }
    | { status: "awaiting-user-input" }
    | { status: "requesting-session" }
    | { status: "awaiting-user-ok"; token: SessionToken };
  studyCode: StudyCode;
  nFailedAttempts: number;
};

type ValidSessionState = { status: "valid"; token: SessionToken };

export type SessionState =
  | ScalarSessionState
  | JoiningSessionState
  | ValidSessionState;

type ScalarStateStatus = ScalarSessionState["status"];

export type ISessionState = SessionState & {
  setNoSession: Action<ISessionState>;
  setValidatingSavedSession: Action<ISessionState>;
  setFailed: Action<ISessionState>;
  setSigningOut: Action<ISessionState>;
  setSignedOut: Action<ISessionState>;
  tryJoinStudy: Action<ISessionState, StudyCode>;
};

const setScalarStatus = (status: ScalarStateStatus): Action<ISessionState> =>
  action((_state) => ({ status }));

export const sessionState: ISessionState = {
  status: studyEnabled ? "booting" : "not-in-use",

  setNoSession: setScalarStatus("no-valid-session"),
  setValidatingSavedSession: setScalarStatus("validating-saved-session"),
  setFailed: setScalarStatus("failed"),
  setSigningOut: setScalarStatus("signing-out"),
  setSignedOut: setScalarStatus("signed-out"),

  tryJoinStudy: action(
    (_state, studyCode) =>
      ({
        status: "joining",
        phase: { status: "awaiting-user-input" },
        studyCode,
        nFailedAttempts: 0,
      } as const)
  ),
};
