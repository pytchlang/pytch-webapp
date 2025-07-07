import React from "react";
import { UpsertSpriteModal } from "./async-flow-modals/UpsertSpriteModal";
import { UpsertHandlerModal } from "./async-flow-modals/UpsertHandlerModal";
import { DeleteSpriteModal } from "./async-flow-modals/DeleteSpriteModal";
import { DeleteHandlerModal } from "./async-flow-modals/DeleteHandlerModal";
import { AddClipArtModal } from "../async-flow-modals/AddClipArtModal";

export const Modals = () => {
  return (
    <>
      <AddClipArtModal />
      <UpsertSpriteModal />
      <UpsertHandlerModal />
      <DeleteSpriteModal />
      <DeleteHandlerModal />
    </>
  );
};
