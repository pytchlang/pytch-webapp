import { Action, thunk } from "easy-peasy";
import { propSetterAction, simpleReadArrayBuffer } from "../../utils";
import { addAssetToProject } from "../../database/indexed-db";
import {
  FileProcessingFailure,
  IProcessFilesInteraction,
  processFilesBase,
} from "./process-files";

export type AddAssetsInteraction = IProcessFilesInteraction & {
  assetNamePrefix: string;
  setAssetNamePrefix: Action<AddAssetsInteraction, string>;
};

export const addAssetsInteraction: AddAssetsInteraction = {
  ...processFilesBase(),

  assetNamePrefix: "",
  setAssetNamePrefix: propSetterAction("assetNamePrefix"),

  tryProcess: thunk(async (actions, files, helpers) => {
    // It's possible this will change while we're working, e.g., if the
    // user hits "back" and then opens a different project.  Make sure
    // we add all assets to the project which was live when the thunk
    // was launched.
    const projectId = helpers.getStoreState().activeProject.project.id;

    actions.setScalar("trying-to-process");

    let failedAdds: Array<FileProcessingFailure> = [];

    for (const file of files) {
      try {
        const fileBuffer = await simpleReadArrayBuffer(file);
        await addAssetToProject(projectId, file.name, file.type, fileBuffer);
      } catch (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        e: any
      ) {
        console.error("addAssetsInteraction.tryProcess():", e);
        failedAdds.push({ fileName: file.name, reason: e.message });
      }
    }

    // Check the active project now is the same one we worked with.
    const liveProjectId = helpers.getStoreState().activeProject.project.id;
    if (liveProjectId !== projectId) {
      console.log(
        `assets added to project ${projectId}` +
          ` but now active is project ${liveProjectId}; bailing`
      );
      return;
    }

    await helpers.getStoreActions().activeProject.syncAssetsFromStorage();

    if (failedAdds.length > 0) {
      actions.setFailed(failedAdds);
    } else {
      actions.setScalar("idle");
    }
  }),
};
