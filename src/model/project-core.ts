import { LinkedContentRef } from "./linked-content-core";
import { PytchProgram } from "./pytch-program-types";

export type ProjectId = number;

export type ProjectContent<AssetT> = {
  program: PytchProgram;
  assets: Array<AssetT>;
};

export type StoredProjectData<AssetT> = ProjectContent<AssetT> & {
  id: ProjectId;
  name: string;
  linkedContentRef: LinkedContentRef;
};

type RemoteAsset = {
  urlBasename: string;
  customLocalName?: string;
};

export type RemoteAssetProjectDescriptor = ProjectContent<RemoteAsset>;
