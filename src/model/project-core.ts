import { LinkedContentRef } from "./linked-content-core";
import { PytchProgram } from "./pytch-program";
import { ITutorialContent } from "./tutorial";

export type ProjectId = number;

// TODO: Move this to linked-content if it turns out to be a good idea
// to unify linked-content with tutorials.
export interface ITrackedTutorial {
  content: ITutorialContent;
  activeChapterIndex: number;
}

export type ProjectContent<AssetT> = {
  program: PytchProgram;
  assets: Array<AssetT>;
};

export type StoredProjectData<AssetT> = ProjectContent<AssetT> & {
  id: ProjectId;
  name: string;
  linkedContentRef: LinkedContentRef;
  trackedTutorial?: ITrackedTutorial;
};

type RemoteAsset = {
  urlBasename: string;
  customLocalName?: string;
};

export type RemoteAssetProjectDescriptor = ProjectContent<RemoteAsset>;
