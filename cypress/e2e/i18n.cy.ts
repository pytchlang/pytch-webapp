context("Internationalisation", () => {
  it("language choice on front page", () => {
    cy.pytchResetDatabase();

    const langSpecs = [
      { code: "en", textMatch: "A bridge from Scratch to Python" },
      { code: "ga", textMatch: "Droichead ó Scratch go Python" },
    ];

    function chooseLanguage(code: string) {
      cy.get(".NavbarLanguageChooser a.dropdown-toggle").click();
      cy.get(`.NavbarLanguageChooser a[data-language-code="${code}"]`).click();
    }

    langSpecs.forEach(({ code, textMatch }) => {
      chooseLanguage(code);
      cy.get("header h3").should("have.length", 1).contains(textMatch);
      chooseLanguage("en");
    });
  });
});
