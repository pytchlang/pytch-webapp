import { IClipArtGallery, clipArtGallery } from "./clipart-gallery";
import {
  NavigationRequestQueue,
  navigationRequestQueue,
} from "./navigation-request-queue";
import { projectCollection, IProjectCollection } from "./projects";
import {
  ideLayout,
  IIDELayout,
  userConfirmations,
  IUserConfirmations,
  standardOutputPane,
  IPlainTextPane,
  errorReportList,
  IErrorReportList,
} from "./ui";

import {
  EditState as JrEditState,
  editState as jrEditState,
} from "./junior/edit-state";

import { activeProject, IActiveProject } from "./project";
import { tutorialCollection, ITutorialCollection } from "./tutorials";
import { reloadServer, IReloadServer } from "./live-reload";
import { userTextInput, IUserTextInput } from "./user-text-input";
import { variableWatchers, IVariableWatchers } from "./variable-watchers";
import {
  demoFromZipfileURL,
  IDemoFromZipfileURL,
} from "./demo-from-zipfile-url";
import {
  projectFromSpecimenFlow,
  ProjectFromSpecimenFlow,
} from "./project-from-specimen";
import { ActionCreator, Actions, State, ThunkCreator } from "easy-peasy";

import {
  GoogleDriveIntegration,
  googleDriveIntegration,
} from "./google-drive-import-export";
import {
  StandalonePlayDemoState,
  standalonePlayDemoState,
} from "./standalone-play-demo";
import { I18nContextState, i18nContextState } from "./i18n";

import { useStoreActions, useStoreState } from "../store";
import { discoverableDemos, IDiscoverableDemos } from "./discoverable-demos";
import {cloudUser, ICloudUser} from "./cloud-storage";

export interface IPytchAppModel {
  navigationRequestQueue: NavigationRequestQueue;
  projectCollection: IProjectCollection;
  activeProject: IActiveProject;
  tutorialCollection: ITutorialCollection;
  ideLayout: IIDELayout;
  jrEditState: JrEditState;
  userConfirmations: IUserConfirmations;
  standardOutputPane: IPlainTextPane;
  errorReportList: IErrorReportList;
  reloadServer: IReloadServer;
  userTextInput: IUserTextInput;
  variableWatchers: IVariableWatchers;
  demoFromZipfileURL: IDemoFromZipfileURL;
  projectFromSpecimenFlow: ProjectFromSpecimenFlow;
  clipArtGallery: IClipArtGallery;
  googleDriveImportExport: GoogleDriveIntegration;
  standalonePlayDemoState: StandalonePlayDemoState;
  i18nContextState: I18nContextState;
  discoverableDemos: IDiscoverableDemos;
  cloudUser: ICloudUser;
}

export type PytchAppModelActions = Actions<IPytchAppModel>;

export const pytchAppModel: IPytchAppModel = {
  navigationRequestQueue,
  projectCollection,
  activeProject,
  tutorialCollection,
  ideLayout,
  jrEditState,
  userConfirmations,
  standardOutputPane,
  errorReportList,
  reloadServer,
  userTextInput,
  variableWatchers,
  demoFromZipfileURL,
  projectFromSpecimenFlow,
  clipArtGallery,
  googleDriveImportExport: googleDriveIntegration,
  standalonePlayDemoState,
  i18nContextState,
  discoverableDemos,
  cloudUser,
};

export function useFlowState<ResultT>(
  flowMapper: (flows: State<IUserConfirmations>) => ResultT
) {
  return useStoreState((state) => flowMapper(state.userConfirmations));
}

export function useFlowActions<ResultT>(
  flowMapper: (flows: Actions<IUserConfirmations>) => ResultT
) {
  return useStoreActions((actions) => flowMapper(actions.userConfirmations));
}

type HasRunActionOrThunk<RunArgsT> = {
  run: ActionCreator<RunArgsT> | ThunkCreator<RunArgsT, void>;
};

export function useRunFlow<RunArgsT>(
  flowMapper: (
    flows: Actions<IUserConfirmations>
  ) => HasRunActionOrThunk<RunArgsT>
) {
  return useStoreActions(
    (actions) => flowMapper(actions.userConfirmations).run
  );
}
