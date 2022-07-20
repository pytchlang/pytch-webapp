import { Action, action, Actions, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from "..";
import { IModalUserInteraction, modalUserInteraction } from ".";
import { ClipArtGalleryItem } from "../clipart-gallery";
import { ProjectId } from "../projects";
import { addRemoteAssetToProject } from "../../database/indexed-db";

type SelectClipArtDescriptor = {
  selectedIds: Array<number>;
  galleryItems: Array<ClipArtGalleryItem>;
  projectId: ProjectId;
};