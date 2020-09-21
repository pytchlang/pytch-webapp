/// <reference types="cypress" />

context("Management of project assets", () => {
  beforeEach(() => {
    cy.pytchExactlyOneProject();
    cy.contains("Images and sounds").click();
  });

  const initialAssets = ["red-rectangle-80-60.png", "sine-1kHz-2s.mp3"];

  it("shows project assets", () => {
    cy.pytchShouldShowAssets(initialAssets);
  });

  it("can add image asset", () => {
    cy.contains("Add an image").click();
    cy.contains("Add to project").should("be.disabled");
    cy.get(".form-control-file").attachFile(
      "sample-project-assets/green-circle-64.png"
    );
    cy.contains("Add to project").should("not.be.disabled").click();
    cy.get(".modal-content").should("not.exist");
    cy.pytchShouldShowAssets([...initialAssets, "green-circle-64.png"]);
  });

  const launchDeletion = (assetName) => {
    cy.contains(assetName)
      .parent()
      .within(() => {
        cy.get(".dropdown").click();
        cy.contains("DELETE").click();
      });
  };

  initialAssets.forEach((assetName, assetIndex) => {
    it(`can delete (${assetIndex})th asset`, () => {
      launchDeletion(assetName);
      cy.get("button").contains("DELETE").click();

      const expectedAssets = initialAssets.slice();
      expectedAssets.splice(assetIndex, 1);

      cy.pytchShouldShowAssets(expectedAssets);
    });
  });
});
