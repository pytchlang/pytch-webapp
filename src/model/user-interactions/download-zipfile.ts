import { Action } from "easy-peasy";
import { delaySeconds, PYTCH_CYPRESS } from "../../utils";
import { saveAs } from "file-saver";
import { zipfileDataFromProject } from "../../storage/zipfile";
import {
  applyFormatSpecifier,
  FormatSpecifier,
  uniqueUserInputFragment,
} from "../compound-text-input";
import {
  asyncUserFlowSlice,
  AsyncUserFlowSlice,
  noModalWithVoid,
  setRunStateProp,
  VoidOutcome,
} from "./async-user-flow";
import { StoredProjectContent } from "../project";
import { IPytchAppModel, PytchAppModelActions } from "../../model";
import { NavigationAbandonmentGuard } from "../../navigation-abandonment-guard";

type DownloadZipfileRunArgs = {
  project: StoredProjectContent;
  formatSpecifier: FormatSpecifier;
};

type DownloadZipfileRunState = {
  formatSpecifier: FormatSpecifier;
  fileContents: Uint8Array;
  uiFragmentValue: string; // "ui" = "user input"
};

type DownloadZipfileBase = AsyncUserFlowSlice<
  IPytchAppModel,
  DownloadZipfileRunArgs,
  DownloadZipfileRunState
>;

type SAction<ArgT> = Action<DownloadZipfileBase, ArgT>;

type DownloadZipfileActions = {
  setUiFragmentValue: SAction<string>;
};

export type DownloadZipfileFlow = DownloadZipfileBase & DownloadZipfileActions;

async function prepare(
  args: DownloadZipfileRunArgs,
  actions: PytchAppModelActions,
  navigationGuard: NavigationAbandonmentGuard
): Promise<DownloadZipfileRunState> {
  await navigationGuard.throwIfAbandoned(
    actions.activeProject.requestSyncToStorage()
  );

  const uiFragment = uniqueUserInputFragment(args.formatSpecifier);
  const uiFragmentValue = uiFragment.initialValue;

  // Avoid flash of the "Working" spinner.
  await navigationGuard.throwIfAbandoned(delaySeconds(1.0));

  const fileContents = await navigationGuard.throwIfAbandoned(
    zipfileDataFromProject(args.project)
  );

  return {
    formatSpecifier: args.formatSpecifier,
    fileContents,
    uiFragmentValue,
  };
}

function isSubmittable(runState: DownloadZipfileRunState) {
  return runState.uiFragmentValue !== "";
}

async function attempt(
  runState: DownloadZipfileRunState
): Promise<VoidOutcome> {
  const mimeTypeOption = { type: "application/zip" };
  const zipBlob = new Blob([runState.fileContents], mimeTypeOption);

  const rawFilename = applyFormatSpecifier(
    runState.formatSpecifier,
    runState.uiFragmentValue
  );

  // Add ".zip" extension if not already present.  (Clients should
  // be using a format-specifier which ensures this, but don't assume.)
  const alreadyHaveExtension = rawFilename.endsWith(".zip");
  const extraExtension = alreadyHaveExtension ? "" : ".zip";
  const filename = `${rawFilename}${extraExtension}`;

  // Currently no easy way to automate testing of downloaded files, so
  // at least make it so we can test up to the point of creating the blob
  // ready for download.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).Cypress) {
    PYTCH_CYPRESS()["latestDownloadZipfile"] = {
      filename,
      blob: zipBlob,
    };
  } else {
    saveAs(zipBlob, filename);
  }

  return noModalWithVoid;
}

export let downloadZipfileFlow: DownloadZipfileFlow = (() => {
  const specificSlice: DownloadZipfileActions = {
    setUiFragmentValue: setRunStateProp("uiFragmentValue"),
  };
  return asyncUserFlowSlice(specificSlice, prepare, isSubmittable, attempt);
})();
