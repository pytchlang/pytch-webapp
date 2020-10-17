/// <reference types="cypress" />

context("stage control actions", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  const chooseAction = (itemName: string) => {
    cy.contains("⋮").click();
    cy.contains(itemName).click();
  };

  it("can display and close the Screenshot modal", () => {
    chooseAction("Screenshot");
    cy.contains("on the image");

    // TODO: Would be good to check the image content, but that requires
    // quite a lot of machinery, and there are other priorities
    // currently.

    cy.get("button").contains("OK").click();
  });
});
