/// <reference types="cypress" />

import {
  stageWidth,
  stageHeight,
  stageFullScreenBorderPx,
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

  it("enters and leaves full-screen layout", () => {
    cy.get(".LayoutChooser .full-screen").click();
    cy.get(".CodeEditor").should("not.exist");
    cy.get(".InfoPanel").should("not.exist");
    cy.get(".LayoutChooser").should("not.exist");

    cy.get(".leave-full-screen").click();
    cy.get(".CodeEditor");
    cy.get(".InfoPanel");
    cy.get(".LayoutChooser");
  });

  it("remembers IDE-layout stage dimensions", () => {
    // Click twice to ensure default stage size to start:
    cy.get(".LayoutChooser button.wide-info").click().click();
    cy.pytchDragStageDivider(50);
    cy.get("#pytch-canvas")
      .its("0.width")
      .then((width) => {
        cy.get("#pytch-canvas")
          .its("0.height")
          .then((height) => {
            cy.get(".LayoutChooser .full-screen").click();
            cy.get(".CodeEditor").should("not.exist");

            cy.get("#pytch-canvas").its("0.width").should("be.gt", width);
            cy.get("#pytch-canvas").its("0.height").should("be.gt", height);

            cy.get(".leave-full-screen").click();
            cy.get(".CodeEditor");

            cy.get("#pytch-canvas").its("0.width").should("eq", width);
            cy.get("#pytch-canvas").its("0.height").should("eq", height);
          });
      });
  });

  [
    {
      label: "height-constrained",
      size: [800, 600],
      attr: "height",
      // TODO: Replace this "40" with a constant:
      expValue: 600 - 40 - 2 * stageFullScreenBorderPx,
    },
    {
      label: "width-constrained",
      size: [590, 720],
      attr: "width",
      expValue: 590 - 2 * stageFullScreenBorderPx,
    },
  ].forEach((spec) => {
    it(`resizes stage in ${spec.label} full-screen layout`, () => {
      cy.get(".LayoutChooser button.wide-info").click().click();
      cy.get(".LayoutChooser button.full-screen").click();
      cy.get(".CodeEditor").should("not.exist");
      cy.viewport(spec.size[0], spec.size[1]);
      cy.get("#pytch-canvas").its(`0.${spec.attr}`).should("eq", spec.expValue);
      cy.get(".leave-full-screen").click();
      cy.get(".CodeEditor");
    });
  });
});
