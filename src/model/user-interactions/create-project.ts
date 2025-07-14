import { Action } from "easy-peasy";
import { IPytchAppModel, PytchAppModelActions } from "..";
import { ICreateProjectDescriptor } from "../projects";
import {
  templateKindFromComponents,
  WhetherExampleTag,
} from "../project-templates";
import { PytchProgramKind } from "../pytch-program";
import {
  asyncUserFlowSlice,
  AsyncUserFlowSlice,
  noModalWithVoid,
  setRunStateProp,
  VoidOutcome,
} from "./async-user-flow";

type CreateProjectRunArgs = void;

type CreateProjectRunState = {
  name: string;
  whetherExample: WhetherExampleTag;
  editorKind: PytchProgramKind;
};

type CreateProjectBase = AsyncUserFlowSlice<
  IPytchAppModel,
  CreateProjectRunArgs,
  CreateProjectRunState
>;

type SAction<ArgT> = Action<CreateProjectBase, ArgT>;

type CreateProjectActions = {
  setName: SAction<string>;
  setWhetherExample: SAction<WhetherExampleTag>;
  setEditorKind: SAction<PytchProgramKind>;
};

export type CreateProjectFlow = CreateProjectBase & CreateProjectActions;

async function prepare(_args: void): Promise<CreateProjectRunState> {
  return {
    name: "Untitled project",
    whetherExample: "with-example",
    editorKind: "per-method",
  };
}

function isSubmittable(runState: CreateProjectRunState): boolean {
  return runState.name !== "";
}

async function attempt(
  runState: CreateProjectRunState,
  actions: PytchAppModelActions
): Promise<VoidOutcome> {
  const descriptor: ICreateProjectDescriptor = {
    name: runState.name,
    template: templateKindFromComponents(
      runState.whetherExample,
      runState.editorKind
    ),
  };

  await actions.projectCollection.createNewProjectAndNavigate(descriptor);

  return noModalWithVoid;
}

export let createProjectFlow: CreateProjectFlow = (() => {
  const specificSlice: CreateProjectActions = {
    setName: setRunStateProp("name"),
    setEditorKind: setRunStateProp("editorKind"),
    setWhetherExample: setRunStateProp("whetherExample"),
  };
  return asyncUserFlowSlice(specificSlice, { prepare, isSubmittable, attempt });
})();
