import { Action } from "easy-peasy";
import { propSetterAction } from "../utils";

type ApiBootStatus =
  | { kind: "not-yet-started" }
  | { kind: "pending" }
  | { kind: "succeeded"; api: GoogleDriveApi }
  | { kind: "failed" };

export type GoogleDriveIntegration = {
  apiBootStatus: ApiBootStatus;
  setApiBootStatus: Action<GoogleDriveIntegration, ApiBootStatus>;
};

export let googleDriveIntegration: GoogleDriveIntegration = {
  apiBootStatus: { kind: "not-yet-started" },
  setApiBootStatus: propSetterAction("apiBootStatus"),
};
