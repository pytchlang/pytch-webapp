/// <reference types="cypress" />

context("Work with pop-up diff help", () => {
  beforeEach(() => {
    cy.pytchProjectFollowingTutorial();
  });

  const diffSelector = (kind: string) =>
    `.modal-body .patch-container .diff-${kind}`;

  it("can summon and dismiss diff help", () => {
    cy.get("ul.ToC").contains("Add the player's bat").click();

    // Check can repeatedly summon and dismiss:
    for (let _i = 0; _i !== 3; ++_i) {
      cy.get(".patch-container .header button").eq(0).click();
      cy.get(".modal-body .patch-container").should("have.length", 2);
      cy.get(diffSelector("unch")).contains("BoingBackground");
      cy.get(diffSelector("add")).contains("PlayerBat");
      cy.get(".modal-header .btn-close").click();
      cy.get(".modal").should("not.exist");
    }

    cy.get(".patch-container .header button").eq(3).click();
    cy.get(".modal-body .patch-container").should("have.length", 3);
    cy.get(diffSelector("unch")).contains("go_to_xy");
    cy.get(diffSelector("del")).contains('key_pressed("w"):');
    cy.get(diffSelector("add")).contains("and self.y_position");
    cy.get(".modal").type("{esc}");
    cy.get(".modal").should("not.exist");
  });
});
