import { action, Action, State, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";
import {
  ProjectDescriptor,
} from "../storage/zipfile";

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
};
