import { urlWithinApp } from "../../env-utils";
import { PytchProgramKind } from "../pytch-program";
import {
  AsyncUserFlowSlice,
  alwaysSubmittable,
  asyncUserFlowSlice,
  emptyAttempt,
  idPrepare,
} from "./async-user-flow";
import { IPytchAppModel } from "..";

export function sharingUrlFromSlug(slug: string): string {
  const baseUrl = "/suggested-tutorial";
  return sharingUrlFromUrlComponents(baseUrl, slug);
}

export function sharingUrlFromSlugForDemo(slug: string): string {
  const baseUrl = "/suggested-tutorial-demo";
  return sharingUrlFromUrlComponents(baseUrl, slug);
}

function sharingUrlFromUrlComponents(baseUrl: string, slug: string) {
  return urlWithinApp(`${baseUrl}/${slug}`);
}

type ShareTutorialRunArgs = {
  slug: string;
  displayName: string;
  programKind: PytchProgramKind;
};

type ShareTutorialRunState = ShareTutorialRunArgs;

type ShareTutorialBase = AsyncUserFlowSlice<
  IPytchAppModel,
  ShareTutorialRunArgs,
  ShareTutorialRunState
>;

type ShareTutorialActions = object;

export type ShareTutorialFlow = ShareTutorialBase & ShareTutorialActions;

export let shareTutorialFlow: ShareTutorialFlow = (() => {
  return asyncUserFlowSlice(
    {},
    {
      prepare: idPrepare,
      isSubmittable: alwaysSubmittable,
      attempt: emptyAttempt,
    }
  );
})();
