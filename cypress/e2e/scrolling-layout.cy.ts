import {
  eventHandlerCodeShouldEqual,
  loadFromZipfile,
  selectSprite,
} from "./junior/utils";

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

  it("sprites pane", () => {
    loadFromZipfile("lots-of-sprites");
    cy.get("ol.ActorsList > li").should("have.length", 22);
    assertEltOverflows(".Junior-ActorsList-container .tab-content");
    assertRootSize();
  });

  it("scripts pane", () => {
    loadFromZipfile("ten-scripts");
    selectSprite("Snake");

    // Make sure that all scripts have rendered, including their
    // content.  Without this, the test was flaky under cypress-parallel
    // although failure was not observed under interactive Cypress
    // runner.
    cy.get("ol.Junior-ScriptsList > li").should("have.length", 10);
    for (let i = 0; i < 10; ++i) {
      eventHandlerCodeShouldEqual(i, `# ${i}\n`);
    }

    assertEltOverflows(".Junior-CodeEditor");
    assertRootSize();
  });

  it("help sidebar", () => {
    loadFromZipfile("lots-of-sprites");
    cy.get(".ActivityContent > .HelpSidebar details.category-control").click();
    assertEltOverflows(".ActivityContent > .HelpSidebar");
    assertRootSize();
  });
});
