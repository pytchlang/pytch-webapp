import React from "react";
import { CreateProjectModal } from "./CreateProjectModal";
import AddAssetModal from "./AddAssetModal";
import { ConfirmProjectDeleteModal } from "./ConfirmProjectDeleteModal";

export const AllModals = () => {
  return (
    <>
      <CreateProjectModal />
      <AddAssetModal />
      <ConfirmProjectDeleteModal />
    </>
  );
};
