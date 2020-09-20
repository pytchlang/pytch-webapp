import React from "react";
import { CreateProjectModal } from "./CreateProjectModal";
import AddAssetModal from "./AddAssetModal";
import { ConfirmProjectDeleteModal } from "./ConfirmProjectDeleteModal";
import { ConfirmDangerousActionModal } from "./ConfirmDangerousActionModal";

export const AllModals = () => {
  return (
    <>
      <CreateProjectModal />
      <AddAssetModal />
      <ConfirmProjectDeleteModal />
      <ConfirmDangerousActionModal />
    </>
  );
};
