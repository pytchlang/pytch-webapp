import { Action } from "easy-peasy";
import {CloudProjectId, ProjectId } from "../project-core";
import {
  asyncUserFlowSlice,
  AsyncUserFlowSlice,
  noModalWithVoid,
  setRunStateProp,
  VoidOutcome,
} from "./async-user-flow";
import { IPytchAppModel, PytchAppModelActions } from "..";
import {api} from "../cloud-storage";

type PublishProjectRunArgs = {
  cloudProjectId: CloudProjectId;
};

type PublishProjectRunState = {
  cloudProjectId: CloudProjectId;
};

type PublishProjectBase = AsyncUserFlowSlice<
  IPytchAppModel,
  PublishProjectRunArgs,
  PublishProjectRunState
>;

type SAction<ArgT> = Action<PublishProjectBase, ArgT>;

export type PublishProjectFlow = PublishProjectBase;

async function prepare(
  args: PublishProjectRunArgs
): Promise<PublishProjectRunState> {
  console.log("preparing publish")
  return { ...args, cloudProjectId: args.cloudProjectId };
}

function isSubmittable(runState: PublishProjectRunState): boolean {
  return runState.cloudProjectId !== "";
}

async function attempt(
  runState: PublishProjectRunState,
  actions: PytchAppModelActions
): Promise<VoidOutcome> {
  // await actions.projectCollection.requestPublishProjectThenResync({
  //   id: runState.projectId,
  //   name: runState.newName,
  // });
  const body = JSON.stringify({
    status: 0
  })

  console.log("publishing project with cloud id", runState.cloudProjectId)
  api(`projects/${runState.cloudProjectId}`, {
    method: "PUT",
    header: {
      "Content-Type": "application/json"
    },
    body: body
  })



  return noModalWithVoid;
}

function onCompleted(
  _runState: PublishProjectRunState,
  _outcomeNub: void,
  storeActions: PytchAppModelActions
) {
  storeActions.activeProject.pulseNotableChange({
    kind: "project-published",
  });
}

export let publishProjectFlow: PublishProjectFlow = (() => {
  return asyncUserFlowSlice({}, {
    prepare,
    isSubmittable,
    attempt,
    onCompleted,
  });
})();
