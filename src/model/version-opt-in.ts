import { Action as GenericAction } from "easy-peasy";
import { propSetterAction } from "../utils";

export type VersionTag = "v1" | "v2";

// "Slice action" — Action<> specialised for this slice-type.
type SAction<PayloadT> = GenericAction<VersionOptIn, PayloadT>;

export type VersionOptIn = {
  activeUiVersion: VersionTag;
  setActiveUiVersion: SAction<VersionTag>;
};

export let versionOptIn: VersionOptIn = {
  activeUiVersion: "v1",
  setActiveUiVersion: propSetterAction("activeUiVersion"),
};
