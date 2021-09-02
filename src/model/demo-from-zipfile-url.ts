import { action, Action, State, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";
import {
  ProjectDescriptor,
  projectDescriptorFromURL,
} from "../storage/zipfile";
import { delaySeconds } from "../utils";

type DemoFromZipfileProposingState = {
  state: "proposing";
  projectDescriptor: ProjectDescriptor;
};

type DemoFromZipfileURLState =
  | { state: "booting" }
  | { state: "fetching" }
  | DemoFromZipfileProposingState
  | { state: "creating"; projectDescriptor: ProjectDescriptor }
  | { state: "error"; message: string }
  | { state: "idle" };

type StateLabel = DemoFromZipfileURLState["state"];

export type IDemoFromZipfileURL = DemoFromZipfileURLState & {
  boot: Thunk<IDemoFromZipfileURL, string>;
  setIdle: Action<IDemoFromZipfileURL>;
  setFetching: Action<IDemoFromZipfileURL>;
  setProposing: Action<IDemoFromZipfileURL, ProjectDescriptor>;
  setCreating: Action<IDemoFromZipfileURL, ProjectDescriptor>;
  createProject: Thunk<IDemoFromZipfileURL, void, {}, IPytchAppModel>;
  fail: Action<IDemoFromZipfileURL, string>;
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
};
