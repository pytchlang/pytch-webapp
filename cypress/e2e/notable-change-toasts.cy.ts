import { GatedDelay } from "./utils";

////////////////////////////////////////////////////////////////////////

type ItShowsToastForDescriptor = {
  only?: boolean;
  setup: () => void;
  submit: () => void;
  toastBodyMatch: string | RegExp;
};

function itShowsToastFor(label: string, descr: ItShowsToastForDescriptor) {
  const createTest = descr.only ?? false ? it.only : it;

  createTest(label, () => {
    descr.setup();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cy.window().then(async (window: any) => {
      const gatedDelay = GatedDelay.installNew(window);
      descr.submit();
      cy.get(".toast-body")
        .should("have.length", 1)
        .contains(descr.toastBodyMatch)
        .then(() => {
          gatedDelay.release();
          cy.get(".toast-body").should("not.exist");
        });
    });
  });
}

////////////////////////////////////////////////////////////////////////

context("Toasts are generated (s/b/s)", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
    cy.pytchTryUploadZipfiles(["newly-created-per-method.zip"]);
  });
});
