import React from "react";
import { UpsertSpriteModal } from "./AddSpriteModal";
import { AddJrAssetsModal } from "./AddAssetsModal";
import { UpsertHandlerModal } from "./UpsertHandlerModal";

export const Modals = () => {
  return (
    <>
      <UpsertSpriteModal />
      <AddJrAssetsModal />
      <UpsertHandlerModal />
    </>
  );
};
