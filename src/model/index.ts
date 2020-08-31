import { projectCollection, IProjectCollection } from "./projects";
import { modals, IModals } from "./ui";
import { activeProject, IActiveProject } from "./project";

export interface IPytchAppModel {
    projectCollection: IProjectCollection;
    activeProject: IActiveProject;
    modals: IModals;
}

export const pytchAppModel: IPytchAppModel = {
  projectCollection,
  activeProject,
  modals,
};
