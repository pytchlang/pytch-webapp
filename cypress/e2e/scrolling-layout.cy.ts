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

context("Scrolling panes", () => {
  const assertRootSize = () => {
    cy.get("main").then(eltShouldNotOverflow);
  };
});
