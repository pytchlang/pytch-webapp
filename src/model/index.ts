import { projectCollection, IProjectCollection } from "./projects";
import { modals, IModals } from "./ui";

export interface IPytchAppModel {
    projectCollection: IProjectCollection;
    modals: IModals;
}

export const pytchAppModel: IPytchAppModel = {
  projectCollection,
  modals,
};
