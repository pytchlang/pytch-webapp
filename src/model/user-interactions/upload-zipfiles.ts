import { thunk } from "easy-peasy";
import {
  addAssetToProject,
  createNewProject,
} from "../../database/indexed-db";
import { projectDescriptor } from "../../storage/zipfile";
import { simpleReadArrayBuffer } from "../../utils";
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
  }),
};
