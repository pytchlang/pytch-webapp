import { projectCollection, IProjectCollection } from "./projects";

export interface IPytchAppModel {
    projectCollection: IProjectCollection;
}

export const pytchAppModel: IPytchAppModel = {
  projectCollection,
};
