import React from "react";
import { CreateProjectModal } from "./CreateProjectModal";
import AddAssetModal from "./AddAssetModal";
import { ConfirmDangerousActionModal } from "./ConfirmDangerousActionModal";
import { RenameAssetModal } from "./RenameAssetModal";
import { DisplayScreenshotModal } from "./DisplayScreenshotModal";

export const AllModals = () => {
  return (
    <>
      <CreateProjectModal />
      <AddAssetModal />
      <RenameAssetModal />
      <DisplayScreenshotModal />
      <ConfirmDangerousActionModal />
    </>
  );
};
