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

export type ISessionState = SessionState & {
  // TODO: Actions/thunks.
};

export const sessionState: ISessionState = {
  status: studyEnabled ? "booting" : "not-in-use",
  // TODO: Actions/thunks.
};
