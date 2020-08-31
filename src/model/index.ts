import { projectCollection, IProjectCollection } from "./projects";
import {
    modals, IModals,
    infoPanel, IInfoPanel,
 } from "./ui";

import { activeProject, IActiveProject } from "./project";

export interface IPytchAppModel {
    projectCollection: IProjectCollection;
    activeProject: IActiveProject;
    modals: IModals;
    infoPanel: IInfoPanel;
}

export const pytchAppModel: IPytchAppModel = {
  projectCollection,
  activeProject,
  modals,
  infoPanel,
};
