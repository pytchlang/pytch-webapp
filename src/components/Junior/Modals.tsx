import React from "react";
import { AddSpriteModal } from "./AddSpriteModal";
import { AddJrAssetsModal } from "./AddAssetsModal";
import { UpsertHandlerModal } from "./UpsertHandlerModal";

export const Modals = () => {
  return (
    <>
      <AddSpriteModal />
      <AddJrAssetsModal />
      <UpsertHandlerModal />
    </>
  );
};
