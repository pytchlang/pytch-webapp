import { Action, action, Actions, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from "..";
import { IModalUserInteraction, modalUserInteraction } from ".";
import { navigate } from "@reach/router";
import { withinApp } from "../../utils";

interface ICreateProjectDescriptor {
  name: string;
}

type ICreateProjectBase = IModalUserInteraction<ICreateProjectDescriptor>;

interface ICreateProjectSpecific {
  name: string;
  setName: Action<ICreateProjectSpecific, string>;

  refreshInputsReady: Thunk<ICreateProjectBase & ICreateProjectSpecific>;
  launch: Thunk<ICreateProjectBase & ICreateProjectSpecific, void>;
}

const attemptCreate = async (
  actions: Actions<IPytchAppModel>,
  descriptor: ICreateProjectDescriptor
) => {
  const createNewProject = actions.projectCollection.createNewProject;
  const newProject = await createNewProject(descriptor.name);
  await navigate(withinApp(`/ide/${newProject.id}`));
};

const createProjectSpecific: ICreateProjectSpecific = {
  name: "",
  setName: action((state, name) => {
    state.name = name;
  }),

  refreshInputsReady: thunk((actions, _payload, helpers) => {
    const state = helpers.getState();
    actions.setInputsReady(state.name !== "");
  }),

  launch: thunk((actions, _payload, helpers) => {
    actions.setName("");
    actions.superLaunch();
  }),
};
