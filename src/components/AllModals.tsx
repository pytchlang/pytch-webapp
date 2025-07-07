import React from "react";
import { CreateProjectModal } from "./async-flow-modals/CreateProjectModal";
import { AddAssetsModal } from "./async-flow-modals/AddAssetsModal";
import { RenameAssetModal } from "./async-flow-modals/RenameAssetModal";
import { RenameProjectModal } from "./async-flow-modals/RenameProjectModal";
import { DisplayScreenshotModal } from "./async-flow-modals/DisplayScreenshotModal";
import { DownloadZipfileModal } from "./async-flow-modals/DownloadZipfileModal";
import { UploadZipfilesModal } from "./async-flow-modals/UploadZipfilesModal";
import { CodeDiffHelpModal } from "./async-flow-modals/CodeDiffHelpModal";
import { CopyProjectModal } from "./async-flow-modals/CopyProjectModal";
import { CropScaleImageModal } from "./async-flow-modals/CropScaleImageModal";
import {
  GoogleAuthenticationStatusModal,
  GoogleGetFilenameFromUserModal,
  GoogleTaskStatusModal,
} from "./GoogleOperationModals";
import { ShareTutorialModal } from "./async-flow-modals/ShareTutorialModal";
import { ViewCodeDiffModal } from "./async-flow-modals/ViewCodeDiffModal";

import { DeleteAssetModal } from "./async-flow-modals/DeleteAssetModal";
import { DeleteProjectModal } from "./async-flow-modals/DeleteProjectModal";
import { DeleteManyProjectsModal } from "./async-flow-modals/DeleteManyProjectsModal";

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
      <CodeDiffHelpModal />
      <CropScaleImageModal />
      <GoogleAuthenticationStatusModal />
      <GoogleTaskStatusModal />
      <GoogleGetFilenameFromUserModal />
      <ShareTutorialModal />
      <ViewCodeDiffModal />
      <DeleteAssetModal />
      <DeleteProjectModal />
      <DeleteManyProjectsModal />
    </>
  );
};
