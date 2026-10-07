import { Action } from "easy-peasy";
import { IPytchAppModel, PytchAppModelActions } from "..";
import { ICreateProjectDescriptor } from "../projects";
import {
  templateKindFromComponents,
  WhetherExampleTag,
} from "../project-templates";
import { PytchProgramKind } from "../pytch-program-types";
import {
  asyncUserFlowSlice,
  AsyncUserFlowSlice,
  noModalWithVoid,
  setRunStateProp,
  VoidOutcome,
} from "./async-user-flow";
import {api} from "../cloud-storage";

export type CreateProjectRunArgs = {
  initialName: string;
  initialCloudStored: boolean;
};

type CreateProjectRunState = {
  name: string;
  whetherExample: WhetherExampleTag;
  editorKind: PytchProgramKind;
  cloudStored: boolean;
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
  setCloudStored: SAction<boolean>;
};
export function parseProgramKind(programKind: string) {
  switch (programKind.toLowerCase()) {
    case "flat":
      return 0;
    case "per-method":
      return 1;
  }
}

export function parseProjectStatus(status: string) {
  switch (status.toLowerCase()) {
    case "listed":
      return 0;
    case "unlisted":
      return 1;
  }
}
export type CreateProjectFlow = CreateProjectBase & CreateProjectActions;

async function prepare(
  args: CreateProjectRunArgs
): Promise<CreateProjectRunState> {
  return {
    name: args.initialName,
    whetherExample: "with-example",
    editorKind: "per-method",
    cloudStored: false,
  };
}

function isSubmittable(runState: CreateProjectRunState): boolean {
  return runState.name !== "";
}

async function attempt(
  runState: CreateProjectRunState,
  actions: PytchAppModelActions
): Promise<VoidOutcome> {
  // TODO: get cloudId from indexed-db and add to activeProject
  let cloudId = null;
  console.log('attempting', runState);



  if (localStorage.getItem("access_token") && runState.cloudStored) {
    const body = JSON.stringify({
      title: runState.name,
      program_kind: parseProgramKind(runState.editorKind),
      status: parseProjectStatus("UNLISTED"),
      archived: false
    })

    await api(`projects`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
        'Content-Type': 'application/json'
      },
      body: body
    })
    .then(res => res.json())
    .then(data => {
      console.log("created new project", data.data);
      cloudId = data.data.id;
    })
    .catch(err => {
      console.log(err);
    });
  }

  const descriptor: ICreateProjectDescriptor = {
    name: runState.name,
    template: templateKindFromComponents(
      runState.whetherExample,
      runState.editorKind
    ),
    cloudId: cloudId,
  };
  console.log("creating and navigating", descriptor);
  await actions.projectCollection.createNewProjectAndNavigate(descriptor);

  return noModalWithVoid;
}

export let createProjectFlow: CreateProjectFlow = (() => {
  const specificSlice: CreateProjectActions = {
    setName: setRunStateProp("name"),
    setEditorKind: setRunStateProp("editorKind"),
    setWhetherExample: setRunStateProp("whetherExample"),
    setCloudStored: setRunStateProp("cloudStored"),
  };
  return asyncUserFlowSlice(specificSlice, { prepare, isSubmittable, attempt });
})();
