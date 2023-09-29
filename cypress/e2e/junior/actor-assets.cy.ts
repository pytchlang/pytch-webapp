context("Working with assets of an actor", () => {
  beforeEach(() => {
    cy.pytchBasicJrProject();
  });

  const clickAddSomething = (match: string) =>
    cy.get("div.tab-pane.active .AddSomethingButton").contains(match).click();
});
