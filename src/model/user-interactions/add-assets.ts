import { thunk } from "easy-peasy";
import { readArraybuffer } from "../../utils";
import { addAssetToProject } from "../../database/indexed-db";
import {
  Failure,
  IProcessFilesInteraction,
  processFilesBase,
} from "./process-files";

// Convert (eg) ProgressUpdate error for unreadable file into something
// a bit more human-friendly:
const simpleReadArraybuffer = async (file: File) => {
  try {
    return await readArraybuffer(file);
  } catch (e) {
    throw new Error("problem reading file");
  }
};

export const addAssetsInteraction: IProcessFilesInteraction = {
  ...processFilesBase(),

  tryProcess: thunk(async (actions, files, helpers) => {
    // It's possible this will change while we're working, e.g., if the
    // user hits "back" and then opens a different project.  Make sure
    // we add all assets to the project which was live when the thunk
    // was launched.
    const projectId = helpers.getStoreState().activeProject.project.id;

    actions.setScalar("trying-to-add");

    let failedAdds: Array<Failure> = [];

    for (const file of files) {
      try {
        const fileBuffer = await simpleReadArraybuffer(file);
        await addAssetToProject(projectId, file.name, file.type, fileBuffer);
      } catch (e) {
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
