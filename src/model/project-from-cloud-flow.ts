import {cloudProjectFromId, projectDescriptor} from "../storage/zipfile";
import {apiArrayBuffer} from "../utils";

import {createNewProject, CreateProjectOptions} from "../database/indexed-db";

import {IPytchAppModel, PytchAppModelActions} from "./index";
import {
  alwaysSubmittable,
  asyncUserFlowSlice,
  AsyncUserFlowSlice,
  idPrepare,
  noModalWithVoid,
  VoidOutcome,
} from "./user-interactions/async-user-flow";
import {NavigationAbandonmentGuard} from "../navigation-abandonment-guard";
import {CloudProjectId} from "./project-core";

type CreateProjectFromCloudRunArgs = {
  cloudProjectId: CloudProjectId;
  cloudUserId: CloudUserId;
};

type CreateProjectFromCloudRunState = CreateProjectFromCloudRunArgs;

// No actions, so no need to separate "base" type from "actions".
export type CreateProjectFromCloudFlow = AsyncUserFlowSlice<
    IPytchAppModel,
    CreateProjectFromCloudRunArgs,
    CreateProjectFromCloudRunState
>;

async function attempt(
    runState: CreateProjectFromCloudRunState,
    actions: PytchAppModelActions,
    navGuard: NavigationAbandonmentGuard
): Promise<VoidOutcome> {
  const { cloudProjectId, cloudUserId } = runState;
  const url = cloudProjectFromId(cloudProjectId);
  console.log("attempt open", url)

  /*await apiArrayBuffer(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
    },
  });*/
  const zipData = await navGuard.throwIfAbandoned(apiArrayBuffer(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
    },
  }));
  console.log("zipdata", zipData);
  // const projectDescriptor: CreateProjectOptions = await projectDescriptorFromURL(url, true);

  const cloudProject = await navGuard.throwIfAbandoned(
      projectDescriptor(undefined, zipData)
  );
  console.log("project descriptor retrieved", cloudProject);

  const creationOptions: CreateProjectOptions = {
    summary: undefined,
    program: cloudProject.program,
    assets: cloudProject.assets,
    cloudProjectId: cloudProjectId,
    cloudUserId: cloudUserId,
  };
  console.log("creation options", creationOptions);

  const project = await navGuard.throwIfAbandoned(
      createNewProject(cloudProject.name, creationOptions)
  );
  actions.projectCollection.noteDatabaseChange();

  actions.navigationRequestQueue.enqueue({
    path: `/ide/${project.id}`,
    opts: { replace: false },
  });

  return noModalWithVoid;
}

export let createProjectFromCloudFlow: CreateProjectFromCloudFlow =
    asyncUserFlowSlice(
        {},
        {
          prepare: idPrepare,
          isSubmittable: alwaysSubmittable,
          attempt,
          autoSubmit: true,
        }
    );
