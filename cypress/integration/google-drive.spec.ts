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

  const specShouldAllBeUsed = (window: any) => {
    const spec = window.$GoogleDriveApiBehaviour;
    const allUsed =
      spec.boot.length === 0 &&
      spec.exportFile.length === 0 &&
      spec.importFiles.length === 0 &&
      spec.acquireToken.length === 0;

    expect(allUsed, "all mock-API behaviour specifiers consumed").eq(true);
  };

  afterEach(() => {
    cy.window().then(specShouldAllBeUsed);
  });
});
