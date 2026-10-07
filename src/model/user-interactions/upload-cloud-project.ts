import { Action } from "easy-peasy";
import { delaySeconds, PYTCH_CYPRESS } from "../../utils";
import { saveAs } from "file-saver";
import { zipfileDataFromProject } from "../../storage/zipfile";
import { applyFormatSpecifier, FormatSpecifier } from "../compound-text-input";
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
import {api, refreshAccessToken} from "../cloud-storage";

type CloudZipfileRunArgs = {
  project: StoredProjectContent;
  formatSpecifier: FormatSpecifier;
  uiFragmentInitialValue: string;
};

type CloudZipfileRunState = {
  formatSpecifier: FormatSpecifier;
  fileContents: Uint8Array<ArrayBuffer>;
  uiFragmentValue: string; // "ui" = "user input"
  project: StoredProjectContent;
};

type CloudZipfileBase = AsyncUserFlowSlice<
  IPytchAppModel,
  CloudZipfileRunArgs,
  CloudZipfileRunState
>;

type SAction<ArgT> = Action<CloudZipfileBase, ArgT>;

type CloudZipfileActions = {
  setUiFragmentValue: SAction<string>;
};

export type CloudZipfileFlow = CloudZipfileBase & CloudZipfileActions;

async function prepare(
  args: CloudZipfileRunArgs,
  actions: PytchAppModelActions,
  navigationGuard: NavigationAbandonmentGuard
): Promise<CloudZipfileRunState> {
  await navigationGuard.throwIfAbandoned(
    actions.activeProject.requestSyncToStorage()
  );

  // Avoid flash of the "Working" spinner.
  await navigationGuard.throwIfAbandoned(delaySeconds(1.0));

  const fileContents = await navigationGuard.throwIfAbandoned(
    zipfileDataFromProject(args.project)
  );

  return {
    formatSpecifier: args.formatSpecifier,
    fileContents,
    uiFragmentValue: args.uiFragmentInitialValue,
    project: args.project
  };
}

function isSubmittable(runState: CloudZipfileRunState) {
  return runState.uiFragmentValue !== "";
}

async function attempt(
  runState: CloudZipfileRunState
): Promise<VoidOutcome> {
  console.log("attempting to upload cloud project")
  const mimeTypeOption = { type: "application/zip" };
  // const zipBlob = new Blob([runState.fileContents], mimeTypeOption);

  const rawFilename = applyFormatSpecifier(
    runState.formatSpecifier,
    runState.uiFragmentValue
  );

  // Add ".zip" extension if not already present.  (Clients should
  // be using a format-specifier which ensures this, but don't assume.)
  const alreadyHaveExtension = rawFilename.endsWith(".zip");
  const extraExtension = alreadyHaveExtension ? "" : ".zip";
  const filename = `${rawFilename}${extraExtension}`;

  console.log("file", runState.fileContents);
  console.log("project-title", runState.project.name);
  const title = runState.project.name;
  console.log("program-kind", runState.project.program.kind);
  const program_kind = runState.project.program.kind;

  const body = JSON.stringify({
    title: title,
    program_kind: program_kind.toUpperCase(),
    status: "UNLISTED",
    archived: false
  })

  const formdata = new FormData();
  formdata.append("uploaded", runState.fileContents);

  api(`projects`, {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
      'Content-Type': 'application/json'
    },
    body: body
  })
      .then(res => res.json())
      .then(data => {
        console.log("dataa", data.data);
        api(`projects/${data.data.id}/upload`, {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: formdata
        } as RequestInit).then(data => {
          getUserProjects();
        })
      })
      .catch(err => {
        console.log(err);
        if (err.status == 401) {
          refreshAccessToken();
        }
      });

  return noModalWithVoid;
}

function onCompleted(
  _runState: unknown,
  _outcomeNub: unknown,
  storeActions: PytchAppModelActions
) {
  storeActions.activeProject.pulseNotableChange({
    kind: "project-download-action-completed",
  });
}

export let uploadZipfileToCloudFlow: CloudZipfileFlow = (() => {
  console.log("upload cloud zip file flow");
  const specificSlice: CloudZipfileActions = {
    setUiFragmentValue: setRunStateProp("uiFragmentValue"),
  };
  return asyncUserFlowSlice(specificSlice, {
    prepare,
    isSubmittable,
    attempt,
    onCompleted,
  });
})();
