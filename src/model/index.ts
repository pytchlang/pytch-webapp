import { projectCollection, IProjectCollection } from "./projects";
import {
  modals,
  IModals,
  infoPanel,
  IInfoPanel,
  standardOutputPane,
  IStandardOutputPane,
  errorReportList,
  IErrorReportList,
} from "./ui";

import { activeProject, IActiveProject } from "./project";
import { tutorialCollection, ITutorialCollection } from "./tutorials";
import { activeTutorial, IActiveTutorial } from "./tutorial";

export interface IPytchAppModel {
  projectCollection: IProjectCollection;
  activeProject: IActiveProject;
  tutorialCollection: ITutorialCollection;
  activeTutorial: IActiveTutorial;
  modals: IModals;
  infoPanel: IInfoPanel;
  standardOutputPane: IStandardOutputPane;
  errorReportList: IErrorReportList;
}

export const pytchAppModel: IPytchAppModel = {
  projectCollection,
  activeProject,
  tutorialCollection,
  activeTutorial,
  modals,
  infoPanel,
  standardOutputPane,
  errorReportList,
};
