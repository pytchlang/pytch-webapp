import { navigate } from "@reach/router";
import { thunk } from "easy-peasy";
import { batch } from "react-redux";
import {
  allProjectSummaries,
  createProjectWithAssets,
} from "../../database/indexed-db";
import { projectDescriptor, wrappedError } from "../../storage/zipfile";
import { simpleReadArrayBuffer, withinApp } from "../../utils";
import { ProjectId } from "../project-core";
import {
  FileProcessingFailure,
  IProcessFilesInteraction,
  processFilesBase,
} from "./process-files";

export const uploadZipfilesInteraction: IProcessFilesInteraction = {
  ...processFilesBase(),

  tryProcess: thunk(async (actions, files, helpers) => {
    actions.setScalar("trying-to-process");

    let failures: Array<FileProcessingFailure> = [];
    let newProjectIds: Array<ProjectId> = [];

    for (const file of files) {
      try {
        const zipData = await simpleReadArrayBuffer(file);

        const projectInfo = await projectDescriptor(file.name, zipData);

        // This clunky nested try/catch ensures consistency in how we
        // present error messages to the user in case of errors
        // occurring during project or asset creation.
        try {
          const projectId = await createProjectWithAssets(
            projectInfo.name,
            projectInfo.summary,
            undefined,
            projectInfo.codeText,
            projectInfo.assets
          );
          newProjectIds.push(projectId);
        } catch (err) {
          throw wrappedError(err as Error);
        }
      } catch (e: any) {
        console.error("uploadZipfilesInteraction.tryProcess():", e);
        failures.push({ fileName: file.name, reason: e.message });
      }
    }

    const nFailures = failures.length;
    let exitActions: Array<() => void> = [
      nFailures > 0
        ? () => actions.setFailed(failures)
        : () => actions.setScalar("idle"),
    ];

    const nSuccesses = newProjectIds.length;
    if (nSuccesses > 0) {
      const summaries = await allProjectSummaries();
      exitActions.push(() =>
        helpers.getStoreActions().projectCollection.setAvailable(summaries)
      );
    }

    if (nFailures === 0 && nSuccesses === 1) {
      await navigate(withinApp(`/ide/${newProjectIds[0]}`));
    }

    batch(() => exitActions.forEach((a) => a()));
  }),
};
