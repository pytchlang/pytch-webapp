import { action, Action, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";
import { createNewProject } from "../database/indexed-db";
import {
  StandaloneProjectDescriptor,
  projectDescriptorFromURL,
} from "../storage/zipfile";
import { delaySeconds } from "../utils";

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

export type IDemoFromZipfileURL = {
  state: DemoFromZipfileURLState;
  boot: Thunk<IDemoFromZipfileURL, string>;
  setIdle: Action<IDemoFromZipfileURL>;
  setFetching: Action<IDemoFromZipfileURL>;
  setProposing: Action<IDemoFromZipfileURL, StandaloneProjectDescriptor>;
  setCreating: Action<IDemoFromZipfileURL, StandaloneProjectDescriptor>;
  createProject: Thunk<IDemoFromZipfileURL, void, void, IPytchAppModel>;
  fail: Action<IDemoFromZipfileURL, string>;
};

function _ensureState<RequiredState extends StateLabel>(
  topLevelState: DemoFromZipfileURLState,
  requiredInnerState: RequiredState
): asserts topLevelState is DemoFromZipfileURLState & { state: RequiredState } {
  const actualInnerState = topLevelState.state;
  if (actualInnerState !== requiredInnerState) {
    throw new Error(
      `expected to be in state "${requiredInnerState}"` +
        ` but in state "${actualInnerState}"`
    );
  }
}

export const demoFromZipfileURL: IDemoFromZipfileURL = {
  state: { state: "booting" },

  setIdle: action((state) => {
    state.state = { state: "idle" };
  }),
  setFetching: action((state) => {
    state.state = { state: "fetching" };
  }),
  setProposing: action((state, projectDescriptor) => {
    state.state = { state: "proposing", projectDescriptor };
  }),
  setCreating: action((state, projectDescriptor) => {
    state.state = { state: "creating", projectDescriptor };
  }),
  fail: action((state, message) => {
    state.state = { state: "error", message };
  }),

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
    const state = helpers.getState().state;
    _ensureState(state, "proposing");

    const projectInfo = state.projectDescriptor;

    actions.setCreating(projectInfo);

    try {
      // The types overlap so can use projectInfo as creationOptions:
      const project = await createNewProject(projectInfo.name, projectInfo);
      const projectId = project.id;

      const allActions = helpers.getStoreActions();
      allActions.projectCollection.noteDatabaseChange();
      allActions.ideLayout.initiateButtonTour();
      allActions.navigationRequestQueue.enqueue({
        path: `/ide/${projectId}`,
        opts: { replace: true },
      });
      actions.setIdle();
    } catch (err) {
      actions.fail(`${err}`);
    }
  }),
};
