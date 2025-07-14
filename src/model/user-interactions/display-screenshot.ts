import {
  AsyncUserFlowSlice,
  alwaysSubmittable,
  asyncUserFlowSlice,
  emptyAttempt,
} from "./async-user-flow";
import { IPytchAppModel } from "..";

type DisplayScreenshotRunArgs = void;

type DisplayScreenshotRunState = object;

// No actions:
export type DisplayScreenshotFlow = AsyncUserFlowSlice<
  IPytchAppModel,
  DisplayScreenshotRunArgs,
  DisplayScreenshotRunState
>;

async function prepare(): Promise<DisplayScreenshotRunState> {
  return {};
}

export let displayScreenshotFlow: DisplayScreenshotFlow = (() => {
  return asyncUserFlowSlice(
    {},
    { prepare, isSubmittable: alwaysSubmittable, attempt: emptyAttempt }
  );
})();
