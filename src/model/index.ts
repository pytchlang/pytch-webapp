import { projectCollection, IProjectCollection } from "./projects";
import {
    modals, IModals,
    infoPanel, IInfoPanel,
    standardOutputPane, IStandardOutputPane,
 } from "./ui";

import { activeProject, IActiveProject } from "./project";
import { tutorialCollection, ITutorialCollection } from "./tutorials";

export interface IPytchAppModel {
    projectCollection: IProjectCollection;
    activeProject: IActiveProject;
    tutorialCollection: ITutorialCollection;
    modals: IModals;
    infoPanel: IInfoPanel;
    standardOutputPane: IStandardOutputPane;
}

export const pytchAppModel: IPytchAppModel = {
  projectCollection,
  activeProject,
  tutorialCollection,
  modals,
  infoPanel,
  standardOutputPane,
};
