import { Action as GenericAction } from "easy-peasy";
import { propSetterAction } from "../utils";

export type VersionTag = "v1" | "v2";
export type V2_OperationState = "idle" | "in-progress";

// "Slice action" — Action<> specialised for this slice-type.
type SAction<PayloadT> = GenericAction<VersionOptIn, PayloadT>;

export type VersionOptIn = {
  activeUiVersion: VersionTag;
  setActiveUiVersion: SAction<VersionTag>;

  v2OperationState: V2_OperationState;
  setV2OperationState: SAction<V2_OperationState>;
};

export let versionOptIn: VersionOptIn = {
  activeUiVersion: "v1",
  setActiveUiVersion: propSetterAction("activeUiVersion"),

  v2OperationState: "idle",
  setV2OperationState: propSetterAction("v2OperationState"),
};
