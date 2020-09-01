import { projectCollection, IProjectCollection } from "./projects";
import {
    modals, IModals,
    infoPanel, IInfoPanel,
    standardOutputPane, IStandardOutputPane,
 } from "./ui";

import { activeProject, IActiveProject } from "./project";

export interface IPytchAppModel {
    projectCollection: IProjectCollection;
    activeProject: IActiveProject;
    modals: IModals;
    infoPanel: IInfoPanel;
    standardOutputPane: IStandardOutputPane;
}

export const pytchAppModel: IPytchAppModel = {
  projectCollection,
  activeProject,
  modals,
  infoPanel,
  standardOutputPane,
};
