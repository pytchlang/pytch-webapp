/// <reference types="cypress" />

type SidebarTestContext = {
  label: string;
  includeEvents: boolean;
  containerSelector: string;
  initialVisibilityPredicate: string;
  hiddenPredicate: string;
  openControlSelector: string;
  closeControlSelector: string;
  before(): void;
};

const flatIdeContext: SidebarTestContext = {
  label: "flat",
  includeEvents: true,
  containerSelector: ".help-sidebar > .content-wrapper",
  initialVisibilityPredicate: "not.be.visible",
  hiddenPredicate: "not.be.visible",
  openControlSelector: ".help-sidebar .control",
  closeControlSelector: ".help-sidebar > .content-wrapper .dismiss-help",
  before() {
    cy.pytchExactlyOneProject();
  },
};

const perMethodIdeContext: SidebarTestContext = {
  label: "per-method",
  includeEvents: false,
  containerSelector: ".ActivityContent > .HelpSidebar",
  initialVisibilityPredicate: "be.visible",
  hiddenPredicate: "not.exist",
  openControlSelector: '.tabkey-icon svg[data-icon="circle-question"]',
  closeControlSelector: '.tabkey-icon svg[data-icon="circle-question"]',
  before() {
    cy.pytchBasicJrProject();
  },
};

const sidebarTestContexts = [flatIdeContext, perMethodIdeContext];

sidebarTestContexts.forEach((ctx) =>
  context(`Help sidebar (${ctx.label})`, () => {
    const useSectionHeadings = (
      callback: (headings: Array<string>) => void
    ) => {
      cy.request("data/help-sidebar.json").then((response) => {
        const headingBlocks = response.body.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item: any) => item.kind === "heading"
        );

        const headingWanted = (heading: string) =>
          heading !== "Events" || ctx.includeEvents;

        const headings = headingBlocks
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => item.heading)
          .filter(headingWanted);

        callback(headings);
      });
    };

    const getHelpContainer = () => cy.get(ctx.containerSelector);

    const assertAllSectionsCollapsed = (headings: Array<string>) => {
      const allHeadingsFlat = headings.join("");
      getHelpContainer().should("contain.text", allHeadingsFlat);
    };

    const assertAllCollapsedExcept = (
      allHeadings: Array<string>,
      expandedHeading: string
    ) => {
      for (const heading of allHeadings) {
        getHelpContainer()
          .find("h1")
          .contains(heading)
          .parent()
          .parent()
          .as("header");
        cy.get("@header").should("have.class", "HelpSidebarSection");

        if (heading !== expandedHeading) {
          cy.get("@header").should("have.text", heading);
        } else {
          cy.get("@header")
            .should("contain.text", heading)
            .should("not.have.text", heading);
        }
      }
    };

    before(ctx.before);

    it("starts with sidebar in correct shown/hidden state", () => {
      getHelpContainer().should(ctx.initialVisibilityPredicate);
    });

    const openSidebar = () => {
      getHelpContainer().should(ctx.hiddenPredicate);
      cy.get(ctx.openControlSelector).click();
      getHelpContainer().should("be.visible");
    };

    const closeSidebar = () => {
      getHelpContainer().should("be.visible");
      cy.get(ctx.closeControlSelector).click();
      getHelpContainer().should(ctx.hiddenPredicate);
    };

    it("allows user to open/close sidebar", () => {
      // Get "per-method" to state expected by rest of tests, which were
      // originally written for "flat".  Bit of a fudge to use "label".
      if (ctx.label === "per-method") {
        closeSidebar();
      }

      openSidebar();
      closeSidebar();
    });

    it("has section list in sidebar", () =>
      useSectionHeadings((headings) => {
        openSidebar();
        assertAllSectionsCollapsed(headings);
        closeSidebar();
      }));

    it("can expand/contract one section", () =>
      useSectionHeadings((headings) => {
        openSidebar();
        getHelpContainer().contains("Operators").click();
        getHelpContainer().contains("math.floor");
        assertAllCollapsedExcept(headings, "Operators");
        getHelpContainer().contains("Operators").click();
        assertAllSectionsCollapsed(headings);
        closeSidebar();
      }));

    it("can expand one section then another", () =>
      useSectionHeadings((headings) => {
        openSidebar();
        getHelpContainer().contains("Operators").click();
        getHelpContainer().contains("math.floor");

        getHelpContainer().contains("Working with variables").click();
        getHelpContainer().contains("pytch.show_variable");
        assertAllCollapsedExcept(headings, "Working with variables");
        getHelpContainer().contains("Working with variables").click();

        // Click centre-left to check for absence of bug SF noticed with
        // hover tooltips in "per-method" editor.
        getHelpContainer().contains("Motion").click("left");
        assertAllCollapsedExcept(headings, "Motion");
        getHelpContainer().contains("Motion").click("left");

        assertAllSectionsCollapsed(headings);
        closeSidebar();
      }));

    it("allows help text to be shown", () => {
      openSidebar();
      getHelpContainer().contains("Looks").click();
      cy.contains("self.backdrop_number")
        .parentsUntil(".pytch-method")
        .parent()
        .within(() => {
          cy.get(".help-button").click();
          cy.contains("Python counts list entries");
          cy.get(".help-button").click();
        });
      getHelpContainer().contains("Looks").click();
      closeSidebar();
    });
  })
);
