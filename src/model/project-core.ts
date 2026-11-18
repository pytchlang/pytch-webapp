import {LinkedContentRef} from "./linked-content-core";
import {PytchProgram, PytchProgramKind} from "./pytch-program-types";
import {ITutorialContent} from "./tutorial";

export type ProjectId = number;
export type CloudProjectId = string;
export type CloudUserId = string;

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
  cloudProjectId: string;
  cloudUserId: string;
};

type RemoteAsset = {
  urlBasename: string;
  customLocalName?: string;
};

export type RemoteAssetProjectDescriptor = ProjectContent<RemoteAsset>;

export enum ProjectVisibility {
  PUBLIC = 0,
  UNLISTED,
  PRIVATE
}

export class ProjectDto {
  id: CloudProjectId;
  status: ProjectVisibility;
  program_kind: PytchProgramKind;
  created_at: string;
  updated_at: string;
  title: string;
  archived: boolean;
}
