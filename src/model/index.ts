import { projectCollection, IProjectCollection } from "./projects";
import {
  modals,
  IModals,
  userConfirmations,
  IUserConfirmations,
  infoPanel,
  IInfoPanel,
  standardOutputPane,
  editorWebSocketLog,
  IStandardOutputPane,
  errorReportList,
  IErrorReportList,
} from "./ui";

import { activeProject, IActiveProject } from "./project";
import { tutorialCollection, ITutorialCollection } from "./tutorials";

export interface IPytchAppModel {
  projectCollection: IProjectCollection;
  activeProject: IActiveProject;
  tutorialCollection: ITutorialCollection;
  modals: IModals;
  userConfirmations: IUserConfirmations;
  infoPanel: IInfoPanel;
  standardOutputPane: IStandardOutputPane;
  errorReportList: IErrorReportList;
  editorWebSocketLog: IStandardOutputPane; // TODO: Rename to c.ITextPane?
}

export const pytchAppModel: IPytchAppModel = {
  projectCollection,
  activeProject,
  tutorialCollection,
  modals,
  userConfirmations,
  infoPanel,
  standardOutputPane,
  errorReportList,
  editorWebSocketLog,
};
