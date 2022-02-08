/// <reference types="cypress" />

import {
  stageWidth,
  stageHeight,
} from "../../src/constants";

context("Full-screen layout", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  it("does not resize stage in IDE layout", () => {
    cy.get(".LayoutChooser button.wide-info").click().click();
    cy.viewport(800, 600);
    cy.get("#pytch-canvas").its("0.width").should("eq", stageWidth);
    cy.get("#pytch-canvas").its("0.height").should("eq", stageHeight);
  });
});
