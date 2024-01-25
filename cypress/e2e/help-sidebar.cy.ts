/// <reference types="cypress" />

type SidebarTestContext = {
  label: string;
  includeEvents: boolean;
  containerSelector: string;
  before(): void;
};

const flatIdeContext: SidebarTestContext = {
  label: "flat",
  includeEvents: true,
  containerSelector: ".help-sidebar > .content-wrapper",
  before() {
    cy.pytchExactlyOneProject();
  },
};

const perMethodIdeContext: SidebarTestContext = {
  label: "per-method",
  includeEvents: false,
  containerSelector: ".ActivityContent > .HelpSidebar",
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
      cy.get(".help-sidebar .inner-content").should(
        "contain.text",
        allHeadingsFlat
      );
    };

    const assertAllCollapsedExcept = (
      allHeadings: Array<string>,
      expandedHeading: string
    ) => {
      for (const heading of allHeadings) {
        if (heading !== expandedHeading) {
          cy.get(".help-sidebar .inner-content h1")
            .contains(heading)
            .parent()
            .should("have.text", heading);
        }
      }
    };

    before(ctx.before);

    it("starts with sidebar hidden", () => {
      cy.get(".help-sidebar .content-wrapper").should("not.be.visible");
    });

    const openSidebar = () => {
      cy.get(".help-sidebar .content-wrapper").should("not.be.visible");
      cy.get(".help-sidebar .control").click();
      cy.get(".help-sidebar .content-wrapper").should("be.visible");
    };

    const closeSidebar = () => {
      cy.get(".help-sidebar .content-wrapper").should("be.visible");
      cy.get(".help-sidebar .dismiss-help").click();
      cy.get(".help-sidebar .content-wrapper").should("not.be.visible");
    };

    it("allows user to open/close sidebar", () => {
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
        cy.get(".help-sidebar").contains("Operators").click();
        cy.get(".help-sidebar").contains("math.floor");
        assertAllCollapsedExcept(headings, "Operators");
        cy.get(".help-sidebar").contains("Operators").click();
        assertAllSectionsCollapsed(headings);
        closeSidebar();
      }));

    it("can expand one section then another", () =>
      useSectionHeadings((headings) => {
        openSidebar();
        cy.get(".help-sidebar").contains("Operators").click();
        cy.get(".help-sidebar").contains("math.floor");
        cy.get(".help-sidebar").contains("Working with variables").click();
        cy.get(".help-sidebar").contains("pytch.show_variable");
        assertAllCollapsedExcept(headings, "Working with variables");
        cy.get(".help-sidebar").contains("Working with variables").click();
        assertAllSectionsCollapsed(headings);
        closeSidebar();
      }));

    it("allows help text to be shown", () => {
      openSidebar();
      cy.get(".help-sidebar").contains("Looks").click();
      cy.contains("self.backdrop_number")
        .parentsUntil(".pytch-method")
        .parent()
        .within(() => {
          cy.get(".help-button").click();
          cy.contains("Python counts list entries");
          cy.get(".help-button").click();
        });
      cy.get(".help-sidebar").contains("Looks").click();
      closeSidebar();
    });
  })
);
