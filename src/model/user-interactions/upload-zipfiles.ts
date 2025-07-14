import { createNewProject } from "../../database/indexed-db";
import { projectDescriptor, wrappedError } from "../../storage/zipfile";
import { simpleReadArrayBuffer } from "../../utils";
import { ProjectId } from "../project-core";
import { FileProcessingFailure } from "./process-files";
import { IPytchAppModel, PytchAppModelActions } from "..";
import {
  AsyncUserFlowSlice,
  asyncUserFlowSlice,
  AttemptOutcome,
  setRunStateProp,
} from "./async-user-flow";
import { Action } from "easy-peasy";
import { NavigationAbandonmentGuard } from "../../navigation-abandonment-guard";

type UploadZipfilesRunArgs = void;

type UploadZipfilesRunState = {
  chosenFiles: FileList | null;
};

type UploadZipfilesAttemptOutcomeNub = {
  nSuccesses: number;
  failures: Array<FileProcessingFailure>;
};

type UploadZipfilesAttemptOutcome =
  AttemptOutcome<UploadZipfilesAttemptOutcomeNub>;

type UploadZipfilesBase = AsyncUserFlowSlice<
  IPytchAppModel,
  UploadZipfilesRunArgs,
  UploadZipfilesRunState,
  UploadZipfilesAttemptOutcomeNub
>;

type SAction<ArgT> = Action<UploadZipfilesBase, ArgT>;

type UploadZipfilesActions = {
  setChosenFiles: SAction<FileList>;
};

export type UploadZipfilesFlow = UploadZipfilesBase & UploadZipfilesActions;

async function prepare(): Promise<UploadZipfilesRunState> {
  return { chosenFiles: null };
}

function isSubmittable(runState: UploadZipfilesRunState) {
  return runState.chosenFiles != null && runState.chosenFiles.length > 0;
}

async function attempt(
  runState: UploadZipfilesRunState,
  actions: PytchAppModelActions,
  navGuard: NavigationAbandonmentGuard
): Promise<UploadZipfilesAttemptOutcome> {
  let failures: Array<FileProcessingFailure> = [];
  let newProjectIds: Array<ProjectId> = [];
  for (const file of runState.chosenFiles ?? []) {
    try {
      const zipData = await navGuard.throwIfAbandoned(
        simpleReadArrayBuffer(file)
      );

      const projectInfo = await navGuard.throwIfAbandoned(
        projectDescriptor(file.name, zipData)
      );

      // This clunky nested try/catch ensures consistency in how we
      // present error messages to the user in case of errors
      // occurring during project or asset creation.
      try {
        // The types overlap so can use projectInfo as creationOptions:
        const project = await navGuard.throwIfAbandoned(
          createNewProject(projectInfo.name, projectInfo)
        );

        const projectId = project.id;
        newProjectIds.push(projectId);
      } catch (error) {
        if (navGuard.wasAbandoned(error)) {
          throw error;
        }

        throw wrappedError(error as Error);
      }
    } catch (error) {
      if (navGuard.wasAbandoned(error)) {
        throw error;
      }

      console.error("upload-zipfiles::attempt():", error);
      failures.push({ filename: file.name, reason: (error as Error).message });
    }
  }

  const nFailures = failures.length;
  const nSuccesses = newProjectIds.length;

  if (nSuccesses > 0) {
    actions.projectCollection.noteDatabaseChange();
  }

  if (nFailures === 0 && nSuccesses === 1) {
    actions.navigationRequestQueue.enqueue({
      path: `/ide/${newProjectIds[0]}`,
    });
  }

  return {
    needsModalNotification: nFailures > 0,
    nub: { nSuccesses, failures },
  };
}

export let uploadZipfilesFlow: UploadZipfilesFlow = (() => {
  const specificSlice: UploadZipfilesActions = {
    setChosenFiles: setRunStateProp("chosenFiles"),
  };
  return asyncUserFlowSlice(specificSlice, { prepare, isSubmittable, attempt });
})();
