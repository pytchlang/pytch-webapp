import { Actions, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from "..";
import { IModalUserInteraction, modalUserInteraction } from ".";
import { failIfNull, withinApp } from "../../utils";
import {
  addAssetToProject,
  allProjectSummaries,
  createNewProject,
} from "../../database/indexed-db";
import { IAddAssetDescriptor } from "../project";
import { navigate } from "@reach/router";

export interface IUploadZipfileDescriptor {
  zipName: string;
  zipData: ArrayBuffer;
}

type IUploadZipfileBase = IModalUserInteraction<IUploadZipfileDescriptor>;

interface IUploadZipfileSpecific {
  launch: Thunk<IUploadZipfileBase & IUploadZipfileSpecific>;
}

// Error machinery is a bit fiddly.  Sometimes we throw an error in the
// middle of a sequence of steps which might throw errors themselves.
// In this case, we do so in a try/catch, and in the "catch", we rethrow
// the error after wrapping in something a bit more friendly.  Other
// times we can throw an error outside any try/catch, in which case we
// explicitly wrap it at the point of throwing it.

const attemptUpload = async (
  actions: Actions<IPytchAppModel>,
  descriptor: IUploadZipfileDescriptor
) => {};

const uploadZipfileSpecific: IUploadZipfileSpecific = {
  launch: thunk((actions) => actions.superLaunch()),
};

export type IUploadZipfileInteraction = IUploadZipfileBase &
  IUploadZipfileSpecific;

export const uploadZipfileInteraction = modalUserInteraction(
  attemptUpload,
  uploadZipfileSpecific
);
