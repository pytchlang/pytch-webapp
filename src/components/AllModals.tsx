import React from "react";
import { CreateProjectModal } from "./CreateProjectModal";
import AddAssetModal from "./AddAssetModal";
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
      <AddAssetModal />
      <RenameAssetModal />
      <DisplayScreenshotModal />
      <DownloadZipfileModal />
      <UploadZipfileModal />
      <ConfirmDangerousActionModal />
    </>
  );
};
