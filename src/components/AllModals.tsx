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
import { CropScaleImageModal } from "./CropScaleImageModal";
import { AddClipartModal } from "./AddClipartModal";
import {
  GoogleAuthenticationStatusModal,
  GoogleGetFilenameFromUserModal,
  GoogleTaskStatusModal,
} from "./GoogleOperationModals";
import { ShareTutorialModal } from "./ShareTutorialModal";
import { ViewCodeDiffModal } from "./ViewCodeDiffModal";
import { VersionOptInOperationModal } from "./VersionOptInOperationModal";

export const AllModals = () => {
  return (
    <>
      <VersionOptInOperationModal />
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
      <CropScaleImageModal />
      <AddClipartModal />
      <GoogleAuthenticationStatusModal />
      <GoogleTaskStatusModal />
      <GoogleGetFilenameFromUserModal />
      <ShareTutorialModal />
      <ViewCodeDiffModal />
    </>
  );
};
