import { thunk } from "easy-peasy";
import { simpleReadArrayBuffer } from "../../utils";
import { addAssetToProject } from "../../database/indexed-db";
import {
  FileProcessingFailure,
  IProcessFilesInteraction,
  processFilesBase,
} from "../user-interactions/process-files";

export const addAssetsInteraction: IProcessFilesInteraction = {
  ...processFilesBase(),

  tryProcess: thunk(async (actions, files, helpers) => {
    // It's possible this will change while we're working, e.g., if the
    // user hits "back" and then opens a different project.  Make sure
    // we add all assets to the project which was live when the thunk
    // was launched.
    const projectId = helpers.getStoreState().activeProject.project.id;
    const focusedActorId = helpers.getStoreState().jrEditState.focusedActor;

    actions.setScalar("trying-to-process");

    let failedAdds: Array<FileProcessingFailure> = [];

    // TODO: Replace with Promise.allSettled().
    //
    for (const file of files) {
      try {
        const fileBuffer = await simpleReadArrayBuffer(file);
        const assetPath = `${focusedActorId}/${file.name}`;
        await addAssetToProject(projectId, assetPath, file.type, fileBuffer);
      } catch (e) {
        console.error("addAssetsInteraction.tryProcess():", e);
        failedAdds.push({ fileName: file.name, reason: (e as Error).message });
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

    // I think it's OK if the user has focussed a different Actor.
    // TODO: Think through this more carefully.
    await helpers.getStoreActions().activeProject.syncAssetsFromStorage();

    if (failedAdds.length > 0) {
      actions.setFailed(failedAdds);
    } else {
      actions.setScalar("idle");
    }
  }),
};
