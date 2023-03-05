import { IClipArtGallery, clipArtGallery } from "./clipart-gallery";
import { projectCollection, IProjectCollection } from "./projects";
import {
  ideLayout,
  IIDELayout,
  userConfirmations,
  IUserConfirmations,
  infoPanel,
  IInfoPanel,
  standardOutputPane,
  editorWebSocketLog,
  IPlainTextPane,
  errorReportList,
  IErrorReportList,
} from "./ui";

import { activeProject, IActiveProject } from "./project";
import { tutorialCollection, ITutorialCollection } from "./tutorials";
import { reloadServer, IReloadServer } from "./live-reload";
import { userTextInput, IUserTextInput } from "./user-text-input";
import { variableWatchers, IVariableWatchers } from "./variable-watchers";
import {
  demoFromZipfileURL,
  IDemoFromZipfileURL,
} from "./demo-from-zipfile-url";
import { Actions } from "easy-peasy";

export interface IPytchAppModel {
  projectCollection: IProjectCollection;
  activeProject: IActiveProject;
  tutorialCollection: ITutorialCollection;
  ideLayout: IIDELayout;
  userConfirmations: IUserConfirmations;
  infoPanel: IInfoPanel;
  standardOutputPane: IPlainTextPane;
  errorReportList: IErrorReportList;
  reloadServer: IReloadServer;
  editorWebSocketLog: IPlainTextPane;
  userTextInput: IUserTextInput;
  variableWatchers: IVariableWatchers;
  demoFromZipfileURL: IDemoFromZipfileURL;
  clipArtGallery: IClipArtGallery;
}

export type PytchAppModelActions = Actions<IPytchAppModel>;

export const pytchAppModel: IPytchAppModel = {
  projectCollection,
  activeProject,
  tutorialCollection,
  ideLayout,
  userConfirmations,
  infoPanel,
  standardOutputPane,
  errorReportList,
  reloadServer,
  editorWebSocketLog,
  userTextInput,
  variableWatchers,
  demoFromZipfileURL,
  clipArtGallery,
};
