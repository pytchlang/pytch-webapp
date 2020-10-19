import { projectCollection, IProjectCollection } from "./projects";
import {
  ideLayout,
  IIDELayout,
  modals,
  IModals,
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

export interface IPytchAppModel {
  projectCollection: IProjectCollection;
  activeProject: IActiveProject;
  tutorialCollection: ITutorialCollection;
  ideLayout: IIDELayout;
  modals: IModals;
  userConfirmations: IUserConfirmations;
  infoPanel: IInfoPanel;
  standardOutputPane: IPlainTextPane;
  errorReportList: IErrorReportList;
  reloadServer: IReloadServer;
  editorWebSocketLog: IPlainTextPane;
}

export const pytchAppModel: IPytchAppModel = {
  projectCollection,
  activeProject,
  tutorialCollection,
  ideLayout,
  modals,
  userConfirmations,
  infoPanel,
  standardOutputPane,
  errorReportList,
  reloadServer,
  editorWebSocketLog,
};
