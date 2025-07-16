import {
  launchAdd,
  launchDeleteActorByIndex,
  launchRenameActorByIndex,
  settleModalDialog,
} from "./junior/utils";
import { GatedDelay } from "./utils";

////////////////////////////////////////////////////////////////////////

type ItShowsToastForDescriptor = {
  only?: boolean;
  setup: () => void;
  submit: () => void;
  failureSelector?: string;
  failureReportMatch?: string | RegExp;
  toastBodyMatch: string | RegExp | null;
};

function itShowsToastFor(label: string, descr: ItShowsToastForDescriptor) {
  const createTest = descr.only ?? false ? it.only : it;

  createTest(label, () => {
    descr.setup();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cy.window().then(async (window: any) => {
      const gatedDelay = GatedDelay.installNew(window);
      descr.submit();
      if (descr.failureReportMatch != null) {
        if (descr.failureSelector == null) {
          throw new Error("need failureSelector if have failureReportMatch");
        }
        cy.get(descr.failureSelector).contains(descr.failureReportMatch);
        settleModalDialog("OK");
      }
      if (descr.toastBodyMatch != null) {
        cy.get(".toast-body")
          .should("have.length", 1)
          .contains(descr.toastBodyMatch)
          .then(() => {
            gatedDelay.release();
            cy.get(".toast-body").should("not.exist");
          });
      } else {
        gatedDelay.release();
      }
    });
  });
}

////////////////////////////////////////////////////////////////////////

context("Toasts are generated (s/b/s)", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
    cy.pytchTryUploadZipfiles(["newly-created-per-method.zip"]);
  });

  itShowsToastFor("add sprite", {
    setup: launchAdd.sprite,
    submit: () => settleModalDialog("OK"),
    toastBodyMatch: '"Sprite1" added to',
  });

  itShowsToastFor("rename sprite", {
    setup: () => {
      launchRenameActorByIndex(1);
      cy.get(".modal-body input").type("{selectAll}{del}PythonLogo");
    },
    submit: () => settleModalDialog("OK"),
    toastBodyMatch: 'Sprite renamed to "PythonLogo"',
  });

  itShowsToastFor("delete sprite", {
    setup: () => launchDeleteActorByIndex(1),
    submit: () => settleModalDialog("DELETE"),
    toastBodyMatch: '"Snake" deleted from',
  });
});
