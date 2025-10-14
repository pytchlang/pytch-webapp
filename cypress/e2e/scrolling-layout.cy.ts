import { loadFromZipfile } from "./junior/utils";

function eltShouldNotOverflow($elts: JQuery<HTMLElement>) {
  cy.wrap($elts.length).should("eq", 1);
  const elt = $elts[0];
  cy.wrap(elt.scrollHeight).should("be.lte", elt.clientHeight);
}

function eltShouldOverflow($elts: JQuery<HTMLElement>) {
  cy.wrap($elts.length).should("eq", 1);
  const elt = $elts[0];
  cy.wrap(elt.scrollHeight).should("be.gt", elt.clientHeight);
}

function assertEltOverflows(selector: string) {
  cy.get(selector).then(eltShouldOverflow);
}

context("Scrolling panes", () => {
  const assertRootSize = () => {
    cy.get("main").then(eltShouldNotOverflow);
  };

  it("error pane", () => {
    loadFromZipfile("multiple-errors-green-flag");
    assertRootSize();
    cy.pytchGreenFlag();
    cy.get("ol.ErrorReportList > li").should("have.length", 4);
    assertEltOverflows(".Junior-InfoPanel-container .tab-content");
    assertRootSize();
  });
});
