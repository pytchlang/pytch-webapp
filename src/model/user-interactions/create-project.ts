import { Action, action, Thunk, thunk } from "easy-peasy";
import { PytchAppModelActions } from "..";
import { IModalUserInteraction, modalUserInteraction } from ".";
import { navigate } from "@reach/router";
import { withinApp } from "../../utils";
import { ICreateProjectDescriptor, ProjectTemplateKind } from "../projects";

type ICreateProjectBase = IModalUserInteraction<ICreateProjectDescriptor>;

interface ICreateProjectSpecific {
  name: string;
  setName: Action<ICreateProjectSpecific, string>;

  template: ProjectTemplateKind;
  setTemplate: Action<ICreateProjectSpecific, ProjectTemplateKind>;

  refreshInputsReady: Thunk<ICreateProjectBase & ICreateProjectSpecific>;
  launch: Thunk<ICreateProjectBase & ICreateProjectSpecific, void>;
}

const attemptCreate = async (
  actions: PytchAppModelActions,
  descriptor: ICreateProjectDescriptor
) => {
  const createNewProject = actions.projectCollection.createNewProject;
  const newProject = await createNewProject(descriptor);
  await navigate(withinApp(`/ide/${newProject.id}`));
};

const createProjectSpecific: ICreateProjectSpecific = {
  name: "",
  setName: action((state, name) => {
    state.name = name;
  }),

  template: "bare-bones",
  setTemplate: action((state, template) => {
    state.template = template;
  }),

  refreshInputsReady: thunk((actions, _payload, helpers) => {
    const state = helpers.getState();
    actions.setInputsReady(state.name !== "");
  }),

  launch: thunk((actions) => {
    actions.setName("Untitled project");
    actions.setTemplate("bare-bones");
    actions.superLaunch();
    // TODO: Can we bring refreshInputsReady() into superclass?
    actions.refreshInputsReady();
  }),
};

export type ICreateProjectInteraction = ICreateProjectBase &
  ICreateProjectSpecific;

export const createProjectInteraction = modalUserInteraction(
  attemptCreate,
  createProjectSpecific
);
