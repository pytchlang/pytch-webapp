import { navigate } from "@reach/router";
import { thunk } from "easy-peasy";
import { batch } from "react-redux";
import {
  addAssetToProject,
  allProjectSummaries,
  createNewProject,
} from "../../database/indexed-db";
import { projectDescriptor } from "../../storage/zipfile";
import { simpleReadArrayBuffer, withinApp } from "../../utils";
import { ProjectId } from "../projects";
import {
  Failure,
  IProcessFilesInteraction,
  processFilesBase,
} from "./process-files";

export const uploadZipfilesInteraction: IProcessFilesInteraction = {
  ...processFilesBase(),

  tryProcess: thunk(async (actions, files, helpers) => {
    actions.setScalar("trying-to-add");

    let failures: Array<Failure> = [];
    let newProjectIds: Array<ProjectId> = [];

    for (const file of files) {
      try {
        const zipData = await simpleReadArrayBuffer(file);

        const projectInfo = await projectDescriptor(file.name, zipData);

        const project = await createNewProject(
          projectInfo.name,
          projectInfo.summary,
          undefined,
          projectInfo.codeText
        );

        await Promise.all(
          projectInfo.assets.map((a) =>
            addAssetToProject(project.id, a.name, a.mimeType, a.data)
          )
        );

        newProjectIds.push(project.id);
      } catch (e) {
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
