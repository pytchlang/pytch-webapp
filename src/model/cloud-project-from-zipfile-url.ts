import {action, Action, Thunk, thunk} from "easy-peasy";
import {IPytchAppModel} from ".";
import {createNewProject, CreateProjectOptions} from "../database/indexed-db";
import {cloudProjectFromId, projectDescriptorFromURL, StandaloneProjectDescriptor,} from "../storage/zipfile";
import {delaySeconds} from "../utils";
import {CloudProjectId} from "./project-core";

type CloudProjectFromZipfileURLState =
  | { state: "booting" }
  | { state: "fetching" }
  | { state: "proposing"; projectDescriptor: StandaloneProjectDescriptor }
  | { state: "creating"; projectDescriptor: StandaloneProjectDescriptor }
  | { state: "error"; message: string }
  | { state: "idle" };

type StateLabel = CloudProjectFromZipfileURLState["state"];

export type ICloudProjectFromZipfileURL = {
  state: CloudProjectFromZipfileURLState;
  boot: Thunk<ICloudProjectFromZipfileURL, CloudProjectId>;
  setIdle: Action<ICloudProjectFromZipfileURL>;
  setFetching: Action<ICloudProjectFromZipfileURL>;
  setProposing: Action<ICloudProjectFromZipfileURL, StandaloneProjectDescriptor>;
  setCreating: Action<ICloudProjectFromZipfileURL, StandaloneProjectDescriptor>;
  createProject: Thunk<ICloudProjectFromZipfileURL, void, void, IPytchAppModel>;
  fail: Action<ICloudProjectFromZipfileURL, string>;
};

function _ensureState<RequiredState extends StateLabel>(
  topLevelState: CloudProjectFromZipfileURLState,
  requiredInnerState: RequiredState
): asserts topLevelState is CloudProjectFromZipfileURLState & { state: RequiredState } {
  const actualInnerState = topLevelState.state;
  if (actualInnerState !== requiredInnerState) {
    throw new Error(
      `expected to be in state "${requiredInnerState}"` +
        ` but in state "${actualInnerState}"`
    );
  }
}

export const cloudProjectFromZipfileURL: ICloudProjectFromZipfileURL = {
  state: { state: "booting" },

  setIdle: action((state) => {
    state.state = { state: "idle" };
  }),
  setFetching: action((state) => {
    state.state = { state: "fetching" };
  }),
  setProposing: action((state, projectDescriptor) => {
      console.log("proposing", state, projectDescriptor)
    state.state = { state: "proposing", projectDescriptor };
  }),
  setCreating: action((state, projectDescriptor) => {
      console.log("creating", state, projectDescriptor)
    state.state = { state: "creating", projectDescriptor };
  }),
  fail: action((state, message) => {
    state.state = { state: "error", message };
  }),

  boot: thunk(async (actions, cloudProjectId) => {
      actions.setFetching();
    await delaySeconds(0.75);
    try {
        const cloudProjectUrl = cloudProjectFromId(cloudProjectId);
        const projectDescriptor: CreateProjectOptions = await projectDescriptorFromURL(cloudProjectUrl, true);
        projectDescriptor.cloudProjectId = cloudProjectId;
        const p2: CreateProjectOptions = projectDescriptor;
        p2.cloudProjectId = "test"
        console.log("updated project descriptor", p2);
      actions.setProposing(p2);
    } catch (err) {
      actions.fail(`${err}`);
    }
  }),

  createProject: thunk(async (actions, _voidPayload, helpers) => {
    const state = helpers.getState().state;
    _ensureState(state, "proposing");

    console.log("state", state)
    const projectInfo = state.projectDescriptor;
    projectInfo.cloudProjectId = "test"

    actions.setCreating(projectInfo);

    try {
      // The types overlap so can use projectInfo as creationOptions:
        console.log("create project with projectInfo", projectInfo);
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
