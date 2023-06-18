import { navigate } from "@reach/router";
import { action, Action, State, Thunk, thunk } from "easy-peasy";
import { batch } from "react-redux";
import { IPytchAppModel } from ".";
import {
  allProjectSummaries,
  createProjectWithAssets,
} from "../database/indexed-db";
import {
  StandaloneProjectDescriptor,
  projectDescriptorFromURL,
} from "../storage/zipfile";
import { delaySeconds, withinApp } from "../utils";

type DemoFromZipfileProposingState = {
  state: "proposing";
  projectDescriptor: StandaloneProjectDescriptor;
};

type DemoFromZipfileURLState =
  | { state: "booting" }
  | { state: "fetching" }
  | DemoFromZipfileProposingState
  | { state: "creating"; projectDescriptor: StandaloneProjectDescriptor }
  | { state: "error"; message: string }
  | { state: "idle" };

type StateLabel = DemoFromZipfileURLState["state"];

export type IDemoFromZipfileURL = DemoFromZipfileURLState & {
  boot: Thunk<IDemoFromZipfileURL, string>;
  setIdle: Action<IDemoFromZipfileURL>;
  setFetching: Action<IDemoFromZipfileURL>;
  setProposing: Action<IDemoFromZipfileURL, StandaloneProjectDescriptor>;
  setCreating: Action<IDemoFromZipfileURL, StandaloneProjectDescriptor>;
  createProject: Thunk<IDemoFromZipfileURL, void, {}, IPytchAppModel>;
  fail: Action<IDemoFromZipfileURL, string>;
};

const _ensureState = (
  topLevelState: State<IDemoFromZipfileURL>,
  requiredInnerState: StateLabel
) => {
  const actualInnerState = topLevelState.state;
  if (actualInnerState !== requiredInnerState) {
    throw new Error(
      `expected to be in state "${requiredInnerState}"` +
        ` but in state "${actualInnerState}"`
    );
  }
};

export const demoFromZipfileURL: IDemoFromZipfileURL = {
  state: "booting",

  setIdle: action((_state) => ({ state: "idle" })),
  setFetching: action((_state) => ({ state: "fetching" })),
  setProposing: action((_state, projectDescriptor) => ({
    state: "proposing",
    projectDescriptor,
  })),
  setCreating: action((_state, projectDescriptor) => ({
    state: "creating",
    projectDescriptor,
  })),
  fail: action((_state, message) => ({ state: "error", message })),

  boot: thunk(async (actions, url) => {
    actions.setFetching();
    await delaySeconds(0.75);
    try {
      const projectDescriptor = await projectDescriptorFromURL(url);
      actions.setProposing(projectDescriptor);
    } catch (err) {
      actions.fail(`${err}`);
    }
  }),

  createProject: thunk(async (actions, _voidPayload, helpers) => {
    // TODO: Is there a nicer way to do this type guarding in TypeScript?
    const uncheckedState = helpers.getState();
    _ensureState(uncheckedState, "proposing");
    const state = uncheckedState as DemoFromZipfileProposingState;

    const projectInfo = state.projectDescriptor;

    actions.setCreating(projectInfo);

    try {
      const projectId = await createProjectWithAssets(
        projectInfo.name,
        projectInfo.summary,
        undefined,
        projectInfo.program,
        projectInfo.assets
      );

      const summaries = await allProjectSummaries();

      await navigate(withinApp(`/ide/${projectId}`), { replace: true });

      batch(() => {
        helpers.getStoreActions().projectCollection.setAvailable(summaries);
        helpers.getStoreActions().ideLayout.initiateButtonTour();
        actions.setIdle();
      });
    } catch (err) {
      actions.fail(`${err}`);
    }
  }),
};
