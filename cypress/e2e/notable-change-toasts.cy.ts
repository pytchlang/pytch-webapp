import {
  clickUniqueButton,
  launchAdd,
  launchCropAssetByIndex,
  launchDeleteActorByIndex,
  launchDeleteAssetByIndex,
  launchRenameActorByIndex,
  launchRenameAssetByIndex,
  selectActorAspect,
  selectSprite,
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

  itShowsToastFor("rename asset", {
    setup: () => {
      selectSprite("Snake");
      selectActorAspect("Costumes");
      launchRenameAssetByIndex(0);
      cy.get(".CompoundTextInput input").type("{selectAll}{del}two-snakes");
    },
    submit: () => settleModalDialog("Rename"),
    toastBodyMatch: 'Costume renamed to "two-snakes.png"',
  });

  const goodPngs = [
    "green-circle-64.png",
    "purple-circle-64.png",
    "red-rectangle-80-60.png",
  ];

  const badPngs = ["not-really-a-png.png", "contains-an-empty-file.zip"];

  itShowsToastFor("rename asset (fail)", {
    setup: () => {
      selectSprite("Snake");
      selectActorAspect("Costumes");
      launchAdd.assetFromThisDevice([goodPngs[0]]);
      settleModalDialog("Add to project");
      launchRenameAssetByIndex(0);
      cy.get(".CompoundTextInput input").type(
        "{selectAll}{del}green-circle-64"
      );
    },
    submit: () => clickUniqueButton("Rename"),
    toastBodyMatch: null,
    failureSelector: ".RenameAssetModal-failure",
    failureReportMatch: /this sprite already contains/,
  });

  itShowsToastFor("crop/rescale image", {
    setup: () => {
      selectSprite("Snake");
      selectActorAspect("Costumes");
      launchCropAssetByIndex(0);
      // We don't have to actually adjust it to get notification.
    },
    submit: () => settleModalDialog("OK"),
    toastBodyMatch: 'Crop/scale for costume "python-logo.png" updated',
  });

  itShowsToastFor("delete costume", {
    setup: () => {
      selectSprite("Snake");
      selectActorAspect("Costumes");
      launchDeleteAssetByIndex(0);
    },
    submit: () => settleModalDialog("DELETE"),
    toastBodyMatch: 'Costume "python-logo.png" deleted from',
  });

  function itShowsToastForAddAssets(
    nGoodAndBad: [number, number],
    toastBodyMatch: string | RegExp | null,
    failureReportMatch?: string | RegExp
  ) {
    const [nGood, nBad] = nGoodAndBad;
    const filePaths = goodPngs.slice(0, nGood).concat(badPngs.slice(0, nBad));
    const submitFun = nBad === 0 ? settleModalDialog : clickUniqueButton;
    itShowsToastFor(`add costumes (${nGood} success, ${nBad} failure)`, {
      setup: () => {
        selectSprite("Snake");
        selectActorAspect("Costumes");
        launchAdd.assetFromThisDevice(filePaths);
      },
      submit: () => submitFun("Add to project"),
      failureSelector: ".modal.add-asset-failures",
      failureReportMatch,
      toastBodyMatch,
    });
  }
});
