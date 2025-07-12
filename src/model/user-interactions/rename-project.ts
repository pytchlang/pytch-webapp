import { Action } from "easy-peasy";
import { ProjectId } from "../project-core";
import {
  asyncUserFlowSlice,
  AsyncUserFlowSlice,
  noModalWithVoid,
  setRunStateProp,
  VoidOutcome,
} from "./async-user-flow";
import { IPytchAppModel, PytchAppModelActions } from "..";

type RenameProjectRunArgs = {
  projectId: ProjectId;
  oldName: string;
};

type RenameProjectRunState = {
  projectId: ProjectId;
  oldName: string;
  newName: string;
};

type RenameProjectBase = AsyncUserFlowSlice<
  IPytchAppModel,
  RenameProjectRunArgs,
  RenameProjectRunState
>;

type SAction<ArgT> = Action<RenameProjectBase, ArgT>;

type RenameProjectActions = {
  setNewName: SAction<string>;
};

export type RenameProjectFlow = RenameProjectBase & RenameProjectActions;

async function prepare(
  args: RenameProjectRunArgs
): Promise<RenameProjectRunState> {
  return { ...args, newName: args.oldName };
}

function isSubmittable(runState: RenameProjectRunState): boolean {
  return runState.newName !== "";
}

async function attempt(
  runState: RenameProjectRunState,
  actions: PytchAppModelActions
): Promise<VoidOutcome> {
  await actions.projectCollection.requestRenameProjectThenResync({
    id: runState.projectId,
    name: runState.newName,
  });

  return noModalWithVoid;
}

export let renameProjectFlow: RenameProjectFlow = (() => {
  const specificSlice: RenameProjectActions = {
    setNewName: setRunStateProp("newName"),
  };
  return asyncUserFlowSlice(specificSlice, prepare, isSubmittable, attempt);
})();
