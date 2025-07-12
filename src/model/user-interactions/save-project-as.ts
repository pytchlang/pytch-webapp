import { Action } from "easy-peasy";
import { ProjectId } from "../project-core";
import { IPytchAppModel, PytchAppModelActions } from "..";
import {
  asyncUserFlowSlice,
  AsyncUserFlowSlice,
  noModalWithVoid,
  setRunStateProp,
  VoidOutcome,
} from "./async-user-flow";
import { NavigationAbandonmentGuard } from "../../navigation-abandonment-guard";

type SaveProjectAsRunArgs = {
  sourceProjectId: ProjectId;
  sourceName: string;
};

type SaveProjectAsRunState = {
  sourceProjectId: ProjectId;
  nameOfCopy: string;
};

type SaveProjectAsBase = AsyncUserFlowSlice<
  IPytchAppModel,
  SaveProjectAsRunArgs,
  SaveProjectAsRunState
>;

type SAction<ArgT> = Action<SaveProjectAsBase, ArgT>;

type SaveProjectAsActions = {
  setNameOfCopy: SAction<string>;
};

export type SaveProjectAsFlow = SaveProjectAsBase & SaveProjectAsActions;

async function prepare(
  args: SaveProjectAsRunArgs,
  actions: PytchAppModelActions
): Promise<SaveProjectAsRunState> {
  await actions.activeProject.requestSyncToStorage();
  return {
    sourceProjectId: args.sourceProjectId,
    nameOfCopy: `Copy of ${args.sourceName}`,
  };
}

function isSubmittable(runState: SaveProjectAsRunState) {
  return runState.nameOfCopy !== "";
}

async function attempt(
  runState: SaveProjectAsRunState,
  actions: PytchAppModelActions,
  navGuard: NavigationAbandonmentGuard
): Promise<VoidOutcome> {
  const newId = await navGuard.throwIfAbandoned(
    actions.projectCollection.requestCopyProjectThenResync({
      sourceProjectId: runState.sourceProjectId,
      nameOfCopy: runState.nameOfCopy,
    })
  );

  actions.navigationRequestQueue.enqueue({
    path: `/ide/${newId}`,
    opts: { replace: true },
  });

  return noModalWithVoid;
}

export let saveProjectAsFlow: SaveProjectAsFlow = (() => {
  const specificSlice: SaveProjectAsActions = {
    setNameOfCopy: setRunStateProp("nameOfCopy"),
  };
  return asyncUserFlowSlice(specificSlice, prepare, isSubmittable, attempt);
})();
