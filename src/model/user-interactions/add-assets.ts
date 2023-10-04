import { Action, Thunk, thunk } from "easy-peasy";
import { propSetterAction, simpleReadArrayBuffer } from "../../utils";
import { addAssetToProject } from "../../database/indexed-db";
import {
  FileProcessingFailure,
  IProcessFilesInteraction,
  processFilesBase,
} from "./process-files";

type AddAssetsLaunchArgs = {
  assetNamePrefix: string;
};

export type AddAssetsInteractionSpecific = {
  assetNamePrefix: string;
  setAssetNamePrefix: Action<AddAssetsInteraction, string>;
  launchAdd: Thunk<AddAssetsInteraction, AddAssetsLaunchArgs>;
};

export type AddAssetsInteraction =
  IProcessFilesInteraction<AddAssetsInteractionSpecific>;

export const addAssetsInteraction: AddAssetsInteraction = {
  ...processFilesBase(),

  assetNamePrefix: "",
  setAssetNamePrefix: propSetterAction("assetNamePrefix"),

  launchAdd: thunk((actions, args) => {
    actions.setAssetNamePrefix(args.assetNamePrefix);
    actions.launch();
  }),

  tryProcess: thunk(async (actions, files, helpers) => {
    // It's possible this will change while we're working, e.g., if the
    // user hits "back" and then opens a different project.  Make sure
    // we add all assets to the project which was live when the thunk
    // was launched.
    const projectId = helpers.getStoreState().activeProject.project.id;

    // TODO: Would be nice if we could do this just with getState(), by
    // using a richer type for tryProcess().
    const assetNamePrefix =
      helpers.getStoreState().userConfirmations.addAssetsInteraction
        .assetNamePrefix;

    actions.setScalar("trying-to-process");

    let failedAdds: Array<FileProcessingFailure> = [];

    for (const file of files) {
      try {
        const fileBuffer = await simpleReadArrayBuffer(file);
        const assetPath = `${assetNamePrefix}${file.name}`;
        await addAssetToProject(projectId, assetPath, file.type, fileBuffer);
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
