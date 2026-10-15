import { LinkedContentRef } from "./linked-content-core";
import { projectDescriptor, projectSummary } from "../storage/zipfile";
import { fetchArrayBuffer } from "../utils";

import { createNewProject, CreateProjectOptions } from "../database/indexed-db";

import { IPytchAppModel, PytchAppModelActions } from "./index";
import { demoProjectZipfileUrl } from "./discoverable-demos";
import {
  alwaysSubmittable,
  asyncUserFlowSlice,
  AsyncUserFlowSlice,
  idPrepare,
  noModalWithVoid,
  VoidOutcome,
} from "./user-interactions/async-user-flow";
import { NavigationAbandonmentGuard } from "../navigation-abandonment-guard";

type CreateProjectFromDemoRunArgs = {
  uuid: string;
  language: string;
};

type CreateProjectFromDemoRunState = CreateProjectFromDemoRunArgs;

// No actions, so no need to separate "base" type from "actions".
export type CreateProjectFromDemoFlow = AsyncUserFlowSlice<
  IPytchAppModel,
  CreateProjectFromDemoRunArgs,
  CreateProjectFromDemoRunState
>;

async function attempt(
  runState: CreateProjectFromDemoRunState,
  actions: PytchAppModelActions,
  navGuard: NavigationAbandonmentGuard
): Promise<VoidOutcome> {
  const { uuid, language } = runState;
  const url = demoProjectZipfileUrl(uuid, language);

  const zipData = await navGuard.throwIfAbandoned(fetchArrayBuffer(url));
  const demoProject = await navGuard.throwIfAbandoned(
    projectDescriptor(undefined, zipData)
  );

  const linkedContentRef: LinkedContentRef = { kind: "demo", uuid, language };

  const creationOptions: CreateProjectOptions = {
    summary: projectSummary(undefined, linkedContentRef),
    program: demoProject.program,
    assets: demoProject.assets,
    linkedContentRef,
  };

  const project = await navGuard.throwIfAbandoned(
    createNewProject(demoProject.name, creationOptions)
  );
  actions.projectCollection.noteDatabaseChange();

  actions.navigationRequestQueue.enqueue({
    path: `/ide/${project.id}`,
    opts: { replace: false },
  });

  return noModalWithVoid;
}

export let createProjectFromDemoFlow: CreateProjectFromDemoFlow =
  asyncUserFlowSlice(
    {},
    {
      prepare: idPrepare,
      isSubmittable: alwaysSubmittable,
      attempt,
      autoSubmit: true,
    }
  );
