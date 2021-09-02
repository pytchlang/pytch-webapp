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
