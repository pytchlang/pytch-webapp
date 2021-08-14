import React from "react";
import { CreateProjectModal } from "./CreateProjectModal";
import { AddAssetsModal } from "./AddAssetsModal";
import { ConfirmDangerousActionModal } from "./ConfirmDangerousActionModal";
import { RenameAssetModal } from "./RenameAssetModal";
import { DisplayScreenshotModal } from "./DisplayScreenshotModal";
import { DownloadZipfileModal } from "./DownloadZipfileModal";
import { UploadZipfileModal } from "./UploadZipfileModal";

export const AllModals = () => {
  return (
    <>
      <CreateProjectModal />
      <AddAssetsModal />
      <RenameAssetModal />
      <DisplayScreenshotModal />
      <DownloadZipfileModal />
      <UploadZipfileModal />
      <ConfirmDangerousActionModal />
    </>
  );
};
