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

  context("with successful boot", () => {
    it("shows error if no auth then succeeds on retry", () => {
      // The user chooses Cancel in the Google log-in pop-up, thereby
      // denying permission.
      const mockBehaviour: MockApiBehaviour = {
        boot: ["ok"],
        acquireToken: ["fail", "ok"],
        exportFile: ["ok"],
        importFiles: [],
      };

      cy.pytchExactlyOneProject(setApiBehaviourOpts(mockBehaviour));
      cy.pytchChooseDropdownEntry("Export");
      cy.get(".modal-header").contains("Export to Google");
      cy.get(".modal-body")
        .find(".outcome-summary.failures")
        .contains(/Could not log in/);
      cy.get("button").contains("OK").click();

      cy.pytchChooseDropdownEntry("Export");
      cy.get(".modal-header").contains("Export to Google");
      cy.get(".modal-body").contains(/Project exported to.*[.]zip/);
      cy.get("button").contains("OK").click();
    });

    it("allows auth cancel if popup closed", () => {
      // The Google auth pop-up appears but is then closed by the user,
      // leaving the user looking at the "authenticating..." modal with
      // its cancel button.  The user has to click "Cancel".
      const mockBehaviour: MockApiBehaviour = {
        boot: ["ok"],
        acquireToken: ["wait"],
        exportFile: [],
        importFiles: [],
      };

      cy.pytchExactlyOneProject(setApiBehaviourOpts(mockBehaviour));
      cy.pytchChooseDropdownEntry("Export");
      cy.get(".modal-header").contains("Connecting to Google");
      cy.get("button").contains("Cancel").click();
      cy.get(".modal-header").contains("Export to Google");
      cy.get(".modal-body")
        .find(".outcome-summary.failures")
        .contains(/User cancelled/);
      cy.get("button").contains("OK").click();
    });

    const assertOutcomeContent = (
      targetClass: string,
      matchers: Array<any>
    ) => {
      const selector = `.outcome-summary.${targetClass}`;
      if (matchers.length === 0) {
        cy.get(selector).should("not.exist");
      } else {
        cy.get(selector)
          .find("li")
          .as("outcome-li")
          .should("have.length", matchers.length);
        matchers.forEach((m, i) => cy.get("@outcome-li").eq(i).contains(m));
      }
    };

    const assertSuccessesAndFailures = (
      expHeader: string,
      expSuccesses: Array<any>,
      expFailures: Array<any>
    ) => {
      cy.get(".modal-header").contains(expHeader);
      assertOutcomeContent("successes", expSuccesses);
      assertOutcomeContent("failures", expFailures);
      cy.get("button").contains("OK").click();
    };
  });
});
