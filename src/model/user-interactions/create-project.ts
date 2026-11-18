import {Action} from "easy-peasy";
import {IPytchAppModel, PytchAppModelActions} from "..";
import {ICreateProjectDescriptor} from "../projects";
import {templateKindFromComponents, WhetherExampleTag,} from "../project-templates";
import {PytchProgramKind} from "../pytch-program-types";
import {
  asyncUserFlowSlice,
  AsyncUserFlowSlice,
  noModalWithVoid,
  setRunStateProp,
  VoidOutcome,
} from "./async-user-flow";
import {api} from "../cloud-storage";
import {ProjectVisibility} from "../project-core";

export type CreateProjectRunArgs = {
  initialName: string;
  initialCloudStored: boolean;
  initialCloudUserId: string;
  initialCloudProjectId: string;
};

type CreateProjectRunState = {
  name: string;
  whetherExample: WhetherExampleTag;
  editorKind: PytchProgramKind;
  cloudStored: boolean;
  cloudUserId: string;
  cloudProjectId: string;
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
    case "public":
      return ProjectVisibility.PUBLIC;
    case "unlisted":
      return ProjectVisibility.UNLISTED;
    case "private":
      return ProjectVisibility.PRIVATE;
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
    cloudUserId: args.initialCloudUserId,
    cloudProjectId: args.initialCloudProjectId
  };
}

function isSubmittable(runState: CreateProjectRunState): boolean {
  return runState.name !== "";
}

async function attempt(
  runState: CreateProjectRunState,
  actions: PytchAppModelActions
): Promise<VoidOutcome> {
  console.log('attempting', runState);

  if (localStorage.getItem("access_token") && runState.cloudStored) {
    const body = JSON.stringify({
      title: runState.name,
      program_kind: parseProgramKind(runState.editorKind),
      status: parseProjectStatus("UNLISTED"),
      archived: false
    })

    const res = await api(`projects`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
        'Content-Type': 'application/json'
      },
      body: body
    });

    if (res.ok) {
      const data = await res.json();
      console.log("created new project", data.data);
      const cloudProjectId = data.data;
      const cloudUserId = runState.cloudUserId

      const descriptor: ICreateProjectDescriptor = {
        name: runState.name,
        template: templateKindFromComponents(
            runState.whetherExample,
            runState.editorKind
        ),
        cloudProjectId: cloudProjectId,
        cloudUserId: cloudUserId,
      };
      console.log(`creating project for cloud user ${cloudUserId} and navigating ${descriptor}`);
      await actions.projectCollection.createNewProjectAndNavigate(descriptor);
    }
    else {
      console.error(res);
    }
  }

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
