/// <reference types="cypress" />

import { AsyncFile } from "../../src/storage/google-drive";
import { MockApiBehaviour } from "../../src/storage/google-drive/mock";

context("Google Drive import and export", () => {
  const setApiBehaviourOpts = (behaviour: MockApiBehaviour) => ({
    extraWindowActions: [
      async (window: Window) => {
        (window as any).$GoogleDriveApiBehaviour = behaviour;
      },
    ],
  });
});
