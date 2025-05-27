import { loadAndRunDemo } from "./utils";

context("event handlers with long scripts", () => {
  beforeEach(() => {
    cy.viewport(1280, 640); // Short enough to require scrolling.
    loadAndRunDemo("per-method-long-scripts")();
  });

  it("keeps cursor line in view", () => {
    cy.contains("Script 1 Line 01")
      .parentsUntil(".PytchScriptEditor")
      .eq(-1)
      .find(".ace_content")
      .type("{ctrl}{home}");

    const assertLineVisible = (lineIdx: number) => {
      const lineNum1b = (lineIdx + 1).toString().padStart(2, "0");
      cy.contains(`Script 1 Line ${lineNum1b}`).should("be.visible");
    };

    const nKeysPerTest = 12;
    const nTestsPerDirection = 4;

    const downs = "{downArrow}".repeat(nKeysPerTest);
    const ups = "{upArrow}".repeat(nKeysPerTest);

    for (let i = 0; i !== nTestsPerDirection; ++i) {
      cy.get("body").type(downs).type("{end} Y");
      assertLineVisible(nKeysPerTest * i);
    }

    for (let i = 0; i !== nTestsPerDirection; ++i) {
      cy.get("body").type(ups).type("{end} X");
      assertLineVisible(nKeysPerTest * (nTestsPerDirection - 1 - i));
    }

    cy.get("button.collapse-or-expand-button").click();
    cy.get(".Junior-InfoPanel-container.isCollapsed");
    cy.contains(`Script 1 Line 01`).should("be.visible");

    cy.get("button.collapse-or-expand-button").click();
    cy.get(".Junior-InfoPanel-container.isCollapsed").should("not.exist");
    cy.contains(`Script 1 Line 01`).should("be.visible");
  });
});
