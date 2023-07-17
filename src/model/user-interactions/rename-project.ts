import { Action, action, Thunk, thunk } from "easy-peasy";
import { PytchAppModelActions } from "..";
import { IRenameProjectDescriptor } from "../project";
import { IModalUserInteraction, modalUserInteraction } from ".";
import { batch } from "react-redux";
import { ProjectId } from "../project-core";
import { RenameProjectArgs } from "../projects";

type IRenameProjectBase = IModalUserInteraction<IRenameProjectDescriptor>;

interface IRenameProjectSpecific {
  projectId: ProjectId;
  oldName: string;
  newName: string;
  setProjectId: Action<IRenameProjectSpecific, ProjectId>;
  setOldName: Action<IRenameProjectSpecific, string>;
  setNewName: Action<IRenameProjectSpecific, string>;
  launch: Thunk<IRenameProjectBase & IRenameProjectSpecific, RenameProjectArgs>;
}

const attemptRename = (
  actions: PytchAppModelActions,
  renameDescriptor: IRenameProjectDescriptor
) =>
  actions.projectCollection.requestRenameProjectThenResync({
    id: renameDescriptor.projectId,
    name: renameDescriptor.newName,
  });

const renameProjectSpecific: IRenameProjectSpecific = {
  projectId: -1,
  oldName: "",
  newName: "",
  setProjectId: action((state, projectId) => {
    state.projectId = projectId;
  }),
  setOldName: action((state, oldName) => {
    state.oldName = oldName;
  }),
  setNewName: action((state, newName) => {
    state.newName = newName;
  }),
  launch: thunk((actions, projectSummary) => {
    batch(() => {
      actions.setProjectId(projectSummary.id);
      actions.setOldName(projectSummary.name);
      actions.setNewName(projectSummary.name);
      actions.superLaunch();
    });
  }),
};

export type IRenameProjectInteraction = IRenameProjectBase &
  IRenameProjectSpecific;
export const renameProjectInteraction = modalUserInteraction(
  attemptRename,
  renameProjectSpecific
);
