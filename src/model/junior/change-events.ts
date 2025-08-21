import { AssetOperationContext } from "../asset";
import { AddAssetsOutcomeNub } from "../user-interactions/add-assets";
import { ActorKind, EventDescriptorKind, Uuid } from "./structured-program";
import {
  HandlerUpsertionActionKind,
  SpriteUpsertionActionKind,
} from "./structured-program/program";

////////////////////////////////////////////////////////////////////////

type PerMethodScriptChangedKind =
  | HandlerUpsertionActionKind
  | "duplicate"
  | "delete";

export type PerMethodScriptChanged = {
  kind: "script-changed";
  scriptChangedKind: PerMethodScriptChangedKind;
  handlerId: Uuid;
  handlerEventKind: EventDescriptorKind;
  actorKind: ActorKind;
  actorName: string;
};

////////////////////////////////////////////////////////////////////////

type PerMethodSpriteChangedKind = SpriteUpsertionActionKind | "delete";

export type PerMethodSpriteChanged = {
  kind: "sprite-changed";
  spriteChangedKind: PerMethodSpriteChangedKind;
  /** The `spriteName` is the *new* name, if this is a rename event. */
  spriteName: string;
};

////////////////////////////////////////////////////////////////////////

export type AssetChanged = {
  kind: "asset-changed";
  assetChangedKind: "update-transform" | "update" | "delete";
  operationContext: AssetOperationContext;
  assetDisplayName: string;
};

////////////////////////////////////////////////////////////////////////

export type AssetsAdded = {
  kind: "assets-added";
  operationContext: AssetOperationContext;
} & AddAssetsOutcomeNub;

////////////////////////////////////////////////////////////////////////

export type ZipfilesUploaded = {
  kind: "zipfiles-uploaded";
  nCreated: number;
  nFailed: number;
};

////////////////////////////////////////////////////////////////////////

// No more information available, because the user can change the name
// of the downloaded file (or cancel the download altogether) after
// specifying it in our modal, and we have no way of knowing what
// happened.
export type ProjectDownloadActionCompleted = {
  kind: "project-download-action-completed";
};

////////////////////////////////////////////////////////////////////////

export type ProjectsDeleted = {
  kind: "projects-deleted";
  nDeleted: number;
};

////////////////////////////////////////////////////////////////////////

// TODO: Might be useful to include the old and new names?
export type ProjectRenamed = {
  kind: "project-renamed";
};
