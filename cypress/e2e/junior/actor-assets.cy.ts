import {
  settleModalDialog,
} from "./utils";

context("Working with assets of an actor", () => {
  beforeEach(() => {
    cy.pytchBasicJrProject();
  });

  const clickAddSomething = (match: string) =>
    cy.get("div.tab-pane.active .AddSomethingButton").contains(match).click();

  const addFromMediaLib = (matches: Array<string>) => {
    clickAddSomething("from media library");

    for (const match of matches) {
      // Sometimes the media library is scrolled such that the chosen
      // image is out of view.  Force Cypress to click it:
      cy.get(".clipart-card .clipart-name")
        .contains(match)
        .should("have.length", 1)
        .click({ force: true });
    }

    const expButtonMatch = `Add ${matches.length}`;
    settleModalDialog(expButtonMatch);
  };

  const addFromFixture = (fixtureBasename: string) => {
    clickAddSomething("from this device");

    // TODO: Remove dup with attachSamples() in project-asset-list.cy.ts
    const fixtureFilename = `sample-project-assets/${fixtureBasename}`;
    cy.get('.form-control[type="file"]').attachFile(fixtureFilename);

    settleModalDialog("Add to project");
  };

  const launchDeleteAssetByIndex = (idx: number) => {
    cy.get(".AssetCard").eq(idx).find("button").click();
    cy.get(".dropdown-item").contains("DELETE").click();
    cy.get(".modal-header").contains("Delete image");
  };
});
