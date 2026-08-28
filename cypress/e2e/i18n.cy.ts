import { PytchProgramKind } from "../../src/model/pytch-program-types";
import { assertInIDE } from "./utils";

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

  type Spec = {
    programKind: PytchProgramKind;
    projectZipfileFixture: string;
  };

  const specs: Array<Spec> = [
    {
      programKind: "per-method",
      projectZipfileFixture: "newly-created-per-method.zip",
    },
    {
      programKind: "flat",
      projectZipfileFixture: "v4-print-things.zip",
    },
  ];

  specs.forEach((spec) => {
    it(`language choice in IDE (${spec.programKind})`, () => {
      cy.pytchResetDatabase();
      cy.pytchTryUploadZipfiles([spec.projectZipfileFixture]);
      assertInIDE(spec.programKind);

      cy.get(".ActivityBarTab.tab-key-i18n").click();

      const langSpecs = [
        { code: "en", textMatch: "Anything your program prints" },
        { code: "ga", textMatch: "Gach rud a phriontálann do chlár" },
      ];

      function chooseLanguage(code: string) {
        cy.get(`.LanguageChooser button[data-language-code="${code}"]`).click();
      }

      langSpecs.forEach(({ code, textMatch }) => {
        chooseLanguage(code);
        cy.get(".StandardOutputPane .info-pane-placeholder").contains(
          textMatch
        );
        chooseLanguage("en");
      });
    });
  });
});
