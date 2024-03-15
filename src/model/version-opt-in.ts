import { Action as GenericAction } from "easy-peasy";

export type VersionTag = "v1" | "v2";

// "Slice action" — Action<> specialised for this slice-type.
type SAction<PayloadT> = GenericAction<VersionOptIn, PayloadT>;

export type VersionOptIn = {
};

export let versionOptIn: VersionOptIn = {
};
