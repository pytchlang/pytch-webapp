import {
  clickUniqueButton,
  launchAdd,
  launchCropAssetByIndex,
  launchDeleteActorByIndex,
  launchDeleteAssetByIndex,
  launchRenameActorByIndex,
  launchRenameAssetByIndex,
  ScriptOps,
  selectActorAspect,
  selectSprite,
  settleModalDialog,
} from "./junior/utils";
import { GatedDelay } from "./utils";

////////////////////////////////////////////////////////////////////////

type FailurePredicate = {
  selector: string;
  reportMatch: string | RegExp;
};

type ItShowsToastForDescriptor = {
  only?: boolean;
  setup: () => void;
  submit: () => void;
  failurePredicate?: FailurePredicate;
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
      if (descr.failurePredicate != null) {
        const failPred = descr.failurePredicate;
        cy.get(failPred.selector).contains(failPred.reportMatch);
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
    failurePredicate: {
      selector: ".RenameAssetModal-failure",
      reportMatch: /this sprite already contains/,
    },
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

  itShowsToastForAddAssets([0, 1], null, /problem creating image.*not-really/);

  itShowsToastForAddAssets(
    [0, 2],
    null,
    /problem creating image.*not-really.*contains-an-empty/
  );

  itShowsToastForAddAssets(
    [1, 0],
    'Costume "green-circle-64.png" added from this device'
  );

  itShowsToastForAddAssets(
    [1, 1],
    /"green-circle-64.png" added.*but problem with one/,
    /problem creating image.*not-really/
  );

  itShowsToastForAddAssets(
    [1, 2],
    /"green-circle-64.png" added.*but problems with 2/,
    /problem creating image.*not-really.*contains-an-empty/
  );

  itShowsToastForAddAssets([3, 0], "3 Costumes added from this device");

  itShowsToastForAddAssets(
    [3, 1],
    /3 Costumes added.*but problem with one/,
    /problem creating image.*not-really/
  );

  itShowsToastForAddAssets(
    [3, 2],
    /3 Costumes added.*but problems with 2/,
    /problem creating image.*not-really.*contains-an-empty/
  );

  itShowsToastFor("add script", {
    setup: () => {
      selectSprite("Snake");
      selectActorAspect("Code");
      launchAdd.script();
      ScriptOps.selectHatBlock("start-as-clone");
    },
    submit: () => settleModalDialog("OK"),
    toastBodyMatch: /New "start as clone".*Sprite "Snake"/,
  });

  itShowsToastFor("update script", {
    setup: () => {
      selectSprite("Snake");
      selectActorAspect("Code");
      ScriptOps.chooseHandlerDropdownItem(0, "Change hat block");
      ScriptOps.selectHatBlock("start-as-clone");
    },
    submit: () => settleModalDialog("OK"),
    toastBodyMatch: /Script.*changed to "start as clone"/,
  });

  itShowsToastFor("delete script", {
    setup: () => {
      selectSprite("Snake");
      selectActorAspect("Code");
      ScriptOps.chooseHandlerDropdownItem(0, "DELETE");
    },
    submit: () => settleModalDialog("DELETE"),
    toastBodyMatch: /"green flag clicked" script deleted.*"Snake"/,
  });
});
