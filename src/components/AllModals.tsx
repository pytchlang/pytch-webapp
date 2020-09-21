import React from "react";
import { CreateProjectModal } from "./CreateProjectModal";
import AddAssetModal from "./AddAssetModal";
import { ConfirmDangerousActionModal } from "./ConfirmDangerousActionModal";
import { RenameAssetModal } from "./RenameAssetModal";

export const AllModals = () => {
  return (
    <>
      <CreateProjectModal />
      <AddAssetModal />
      <RenameAssetModal />
      <ConfirmDangerousActionModal />
    </>
  );
};
