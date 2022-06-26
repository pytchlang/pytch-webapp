import React from "react";
import { CreateProjectModal } from "./CreateProjectModal";
import { AddAssetsModal } from "./AddAssetsModal";
import { ConfirmDangerousActionModal } from "./ConfirmDangerousActionModal";
import { RenameAssetModal } from "./RenameAssetModal";
import { RenameProjectModal } from "./RenameProjectModal";
import { DisplayScreenshotModal } from "./DisplayScreenshotModal";
import { DownloadZipfileModal } from "./DownloadZipfileModal";
import { UploadZipfilesModal } from "./UploadZipfilesModal";
import { CodeDiffHelpModal } from "./CodeDiffHelpModal";
import { CopyProjectModal } from "./CopyProjectModal";

export const AllModals = () => {
  return (
    <>
      <CreateProjectModal />
      <AddAssetsModal />
      <RenameAssetModal />
      <RenameProjectModal />
      <DisplayScreenshotModal />
      <CopyProjectModal />
      <DownloadZipfileModal />
      <UploadZipfilesModal />
      <ConfirmDangerousActionModal />
      <CodeDiffHelpModal />
    </>
  );
};
