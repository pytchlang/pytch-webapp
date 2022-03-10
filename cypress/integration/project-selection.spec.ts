/// <reference types="cypress" />

context("Selecting/deselecting projects", () => {
  const extraProjectNames = [
    "Apples",
    "Bananas",
    "Raspberries",
    "Strawberries",
  ];

  beforeEach(() => {
    cy.pytchResetDatabase({ extraProjectNames });
    cy.contains("My projects").click();
    cy.location("pathname").should("include", "projects");
  });

  const allProjectNames = ["Test seed project", ...extraProjectNames];

  it("can select/deselect projects", () => {
    const normalButtonBarMarker = "Create a new project";
    const someSelectedButtonsMarker = "DELETE";

    cy.get(".buttons").should("contain.text", normalButtonBarMarker);
    cy.get(".buttons").should("not.contain.text", someSelectedButtonsMarker);

    const toggleProjectSelected = (
      name: string,
      expectedIsSelectedPostClick: boolean
    ) => {
      const expectedIsSelectedPreClick = !expectedIsSelectedPostClick;

      cy.contains(name)
        .parent()
        .find("span.selection-check")
        .as("check-circle")
        .should(expectedIsSelectedPreClick ? "be.visible" : "not.be.visible");

      // Have to force the click because element only appears on hover.
      cy.get("@check-circle").click({ force: true });

      cy.get("@check-circle").should(
        expectedIsSelectedPostClick ? "be.visible" : "not.be.visible"
      );
    };

    toggleProjectSelected("Apples", true);
    cy.get(".buttons").should("not.contain.text", normalButtonBarMarker);
    cy.get(".buttons").should("contain.text", someSelectedButtonsMarker);
    cy.get("div.intro span").should("have.text", "1");

    toggleProjectSelected("Bananas", true);
    cy.get(".buttons").should("not.contain.text", normalButtonBarMarker);
    cy.get(".buttons").should("contain.text", someSelectedButtonsMarker);
    cy.get("div.intro span").should("have.text", "2");

    toggleProjectSelected("Apples", false);
    cy.get(".buttons").should("not.contain.text", normalButtonBarMarker);
    cy.get(".buttons").should("contain.text", someSelectedButtonsMarker);
    cy.get("div.intro span").should("have.text", "1");

    toggleProjectSelected("Apples", true);
    cy.get(".buttons").should("not.contain.text", normalButtonBarMarker);
    cy.get(".buttons").should("contain.text", someSelectedButtonsMarker);
    cy.get("div.intro span").should("have.text", "2");

    // Click the left arrow "cancel selection" button:
    cy.get("div.intro button").click();
    cy.get(".buttons").should("contain.text", normalButtonBarMarker);
    cy.get(".buttons").should("not.contain.text", someSelectedButtonsMarker);

    // Once one project is selected, should be able to click anywhere in
    // project card to toggle.
    toggleProjectSelected("Apples", true);
    cy.get("div.intro span").should("have.text", "1");
    cy.contains("Bananas").click();
    cy.get("div.intro span").should("have.text", "2");
    cy.contains("Apples").click();
    cy.get("div.intro span").should("have.text", "1");
    cy.contains("Bananas").click();
    cy.get(".buttons").should("contain.text", normalButtonBarMarker);
    cy.get(".buttons").should("not.contain.text", someSelectedButtonsMarker);
  });

  it("can delete multiple projects", () => {
    const selectProject = (name: string) => {
      cy.contains(name)
        .parent()
        .find("span.selection-check")
        .click({ force: true });
    };

    selectProject("Bananas");
    selectProject("Strawberries");

    cy.get(".buttons").contains("DELETE").click();
    cy.contains("want to delete 2 projects?");
    cy.get(".modal button").contains("Cancel").click();
    cy.get(".modal").should("not.exist");
    cy.pytchProjectNames().should("deep.equal", allProjectNames);

    cy.get(".buttons").contains("DELETE").click();
    cy.contains("want to delete 2 projects?");
    cy.get(".modal button").contains("DELETE").click();
    cy.get(".modal").should("not.exist");

    cy.pytchProjectNames().should("deep.equal", [
      "Test seed project",
      "Apples",
      "Raspberries",
    ]);
  });
});
