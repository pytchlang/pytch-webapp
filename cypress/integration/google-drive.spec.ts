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

  it("disables actions while booting", () => {
    const mockBehaviour: MockApiBehaviour = {
      boot: ["stall"],
      acquireToken: [],
      exportFile: [],
      importFiles: [],
    };

    cy.pytchExactlyOneProject(setApiBehaviourOpts(mockBehaviour));
    cy.contains("⋮").click();
    cy.get(".dropdown-item")
      .contains("Export to Google")
      .should("have.class", "disabled");

    cy.pytchHomeFromIDE();
    cy.contains("My projects").click();
    cy.get("button").contains("Import from Google").should("be.disabled");
  });

  it("shows messages if boot fails", () => {
    const mockBehaviour: MockApiBehaviour = {
      boot: ["fail"],
      acquireToken: [],
      exportFile: [],
      importFiles: [],
    };

    cy.pytchExactlyOneProject(setApiBehaviourOpts(mockBehaviour));
    cy.contains("⋮").click();
    cy.get(".dropdown-item")
      .contains("Drive unavailable")
      .should("have.class", "disabled");

    cy.pytchHomeFromIDE();
    cy.contains("My projects").click();
    cy.get("button").contains("Drive unavailable").should("be.disabled");
  });
});
