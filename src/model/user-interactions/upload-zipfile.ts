import { IModalUserInteraction } from ".";

export interface IUploadZipfileDescriptor {
  zipName: string;
  zipData: ArrayBuffer;
}

type IUploadZipfileBase = IModalUserInteraction<IUploadZipfileDescriptor>;
