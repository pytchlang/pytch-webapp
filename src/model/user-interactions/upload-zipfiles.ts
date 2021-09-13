import { thunk } from "easy-peasy";
import {
  addAssetToProject,
  createNewProject,
} from "../../database/indexed-db";
import { projectDescriptor } from "../../storage/zipfile";
import { simpleReadArrayBuffer } from "../../utils";
import {
  IProcessFilesInteraction,
  processFilesBase,
} from "./process-files";

export const uploadZipfilesInteraction: IProcessFilesInteraction = {
  ...processFilesBase(),

  tryProcess: thunk(async (actions, files, helpers) => {
    actions.setScalar("trying-to-add");

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
      } catch (e) {
        console.error("uploadZipfilesInteraction.tryProcess():", e);
      }
    }
  }),
};
