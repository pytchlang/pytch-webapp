/// <reference types="cypress" />

context("Build and run projects", () => {
  before(() => {
    cy.pytchExactlyOneProject("Test project");
  });

  const stdoutShouldContain = (fragment: string) => {
    cy.get(".nav-item").contains("Output").click();
    cy.get(".SkulptStdout").then(($p) => {
      expect($p[0].innerText).to.contain(fragment);
    });
  };

  it("can print hello world", () => {
    buildCode(`
      import pytch
      print("Hello world")
    `);
    stdoutShouldContain("Hello world\n");
  });
});
