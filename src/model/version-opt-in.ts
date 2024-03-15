import { Action as GenericAction } from "easy-peasy";
import { propSetterAction } from "../utils";

/** Whether we are showing the "Pytch v2" user-interface elements, such
 * as the ability to create script-by-script projects and the
 * script-by-script tutorial. */
export type VersionTag = "v1" | "v2";

/** The user can launch operations from the panel explaining what the
 * new v2 features are.  The type `V2_OperationState` describes whether
 * such an operation is currently in progress.  */
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
