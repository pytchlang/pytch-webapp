/// <reference types="cypress" />

// §6 Creating a project from a demo (the flow)
// §2.10 Creating from a recommended-carousel card
// §8.41 Keyboard activation of a card creates the project
// §11.56 Re-entering /demos after creating a project still works

import { promiseAndResolve } from "../../../src/utils";
import { assertInIDE } from "../utils";
import {
  interceptDemoCatalogue,
  resetAndVisitDemosPage,
  assertDemoSidebar,
  demoCards,
  demoCardCountShouldBe,
  typeSearch,
  clickDemoCardTitle,
  kUniqueDemo,
  kFirstRecommendedName,
} from "./utils";

function shouldBeOnIdePath() {
  cy.location("pathname").should("match", /\/ide\/\d+$/);
}

function projectCountShouldBe(n: number) {
  cy.get(".ProjectList ol li").should("have.length", n);
}

context("Discoverable demos — create project from demo", () => {
  // §6.29 — clicking a card title runs the flow and navigates to the IDE.
  // §6.30 — the created project is linked to the demo, so the Demo sidebar
  //         is shown.
  it("creates a project and opens the IDE with the Demo sidebar", () => {
    resetAndVisitDemosPage();

    typeSearch(kUniqueDemo.name);
    demoCardCountShouldBe(1);
    clickDemoCardTitle(kUniqueDemo.name);

    shouldBeOnIdePath();
    assertDemoSidebar();
    assertInIDE(kUniqueDemo.programKind);
    cy.get(".GenericWorkingModal").should("not.exist");
  });

  // §6.31 — the created project appears in "My projects" with the demo's name
  //         (the demo's project.zip names the project after the demo).
  it("lists the created project under My projects", () => {
    resetAndVisitDemosPage();

    typeSearch(kUniqueDemo.name);
    demoCardCountShouldBe(1);
    clickDemoCardTitle(kUniqueDemo.name);
    assertDemoSidebar();

    cy.pytchHomeFromIDE();
    cy.contains("My projects").click();
    projectCountShouldBe(2);
    cy.get(".ProjectList").contains(kUniqueDemo.name);
  });

  // §2.10 — clicking a recommended card's title starts the same flow.
  it("creates a project from a recommended card", () => {
    resetAndVisitDemosPage();

    cy.get(".demos-recommended .carousel-item.active")
      .contains("h3", kFirstRecommendedName)
      .parent() // Get to <a>
      .click();

    shouldBeOnIdePath();
    assertDemoSidebar();
  });

  // §8.41 / §6.32 — activating a focused card via the keyboard creates the
  //                 project (FocusGroupContainer.onActivate reads
  //                 data-demo-uuid).
  it("creates a project when a focused card is activated by keyboard", () => {
    resetAndVisitDemosPage();

    typeSearch(kUniqueDemo.name);
    demoCardCountShouldBe(1);
    demoCards().first().focus().type("{enter}");

    shouldBeOnIdePath();
    assertDemoSidebar();
  });

  // §6.33 — if the project.zip fetch fails, surface an error rather than
  //         navigating to a broken IDE.
  it("does not navigate to the IDE if the project zip fetch fails", () => {
    resetAndVisitDemosPage();

    // Override just this demo's project.zip with a 500 (most-recent
    // intercept wins).
    cy.intercept("GET", `**/${kUniqueDemo.uuid}/en/project.zip`, {
      statusCode: 500,
    }).as("failedZip");

    typeSearch(kUniqueDemo.name);
    clickDemoCardTitle(kUniqueDemo.name);
    cy.wait("@failedZip");

    // We stay on the demos page; no broken IDE, no stuck working modal.
    cy.get(".DemoSidebar").should("not.exist");
    cy.location("pathname").should("include", "/demos");
    cy.get(".DemosList").should("exist");
    cy.get(".GenericWorkingModal").should("not.exist");
  });

  // §6.34 — abandoning navigation mid-flow does not create a stray project
  //         or leave a stuck modal (NavigationAbandonmentGuard).
  it("no stray project if navigation abandoned mid-flow", () => {
    // The guard reacts to "popstate", so we need in-app history to go
    // back through: reach the demos page from the home page via the
    // nav banner rather than by cy.visit().
    interceptDemoCatalogue();
    cy.pytchResetDatabase();
    cy.visit("/");
    cy.contains("Explore").click();
    cy.get(".dropdown-menu").contains("Demos").click();
    cy.wait("@demosIndex");
    cy.get(".demos-header");

    // Hold the zip fetch until the test releases it, so the flow is
    // still in flight when we leave.
    const { promise: gate, resolve: releaseZip } = promiseAndResolve();
    cy.intercept("GET", `**/${kUniqueDemo.uuid}/en/project.zip`, (req) =>
      gate.then(() =>
        req.reply({
          fixture: `demo-catalogue/${kUniqueDemo.uuid}/en/project.zip`,
        })
      )
    );

    typeSearch(kUniqueDemo.name);
    clickDemoCardTitle(kUniqueDemo.name);
    cy.get(".GenericWorkingModal");

    // Navigate back before the flow completes.  The modal goes when we
    // leave the demos page regardless, so instead check that the flow
    // itself has finished while the zip is still held; a flow which
    // ignored the abandonment would still be "attempting".
    cy.go("back");
    cy.location("href").should("eq", Cypress.config("baseUrl"));
    cy.window()
      .its("PYTCH_CYPRESS.easyPeasyStore")
      .invoke("getState")
      .its("userConfirmations.createProjectFromDemoFlow.fsmState.kind", {
        // Shorter than the held request's timeout, so a failure here is
        // reported as such.
        timeout: 4000,
      })
      .should("eq", "idle");

    // Letting the zip arrive now should have no effect.
    cy.then(releaseZip);

    // No stray project was created (only the seed project remains).
    cy.contains("My projects").click();
    projectCountShouldBe(1);
  });

  // §11.56 — re-entering /demos after creating a project still works.
  it("still shows the catalogue after creating a project from a demo", () => {
    resetAndVisitDemosPage();

    typeSearch(kUniqueDemo.name);
    clickDemoCardTitle(kUniqueDemo.name);
    assertDemoSidebar();

    interceptDemoCatalogue();
    cy.visit("/demos/");
    cy.wait("@demosIndex");
    cy.get(".demos-header");
    demoCardCountShouldBe(10);
  });
});
