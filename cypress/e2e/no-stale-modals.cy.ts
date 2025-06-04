/// <reference types="cypress" />
import {
  initSpecimenIntercepts,
  setInstantDelays,
  launchCreateProjectModal,
  launchProjectInListDropdownAction,
  launchShareTutorialModal,
  selectUniqueProject,
  assertOnHomepage,
  jumpToTutorialChapter,
} from "./utils";
import {
  assertActorNames,
  assertCostumeNames,
  assertHatBlockLabels,
  clickUniqueButton,
  launchAdd,
  launchDeleteActorByIndex,
  launchDeleteAssetByIndex,
  launchDeleteHandlerByIndex,
  launchRenameActorByIndex,
  launchRenameAssetByIndex,
  selectActorAspect,
  selectSprite,
} from "./junior/utils";

context("Modals are cancelled when navigating away", () => {
  ////////////////////////////////////////////////////////////////////////
  // #region Common set-up

  before(() => {
    initSpecimenIntercepts();

    cy.pytchResetDatabase();
    cy.visit("/lesson/hello-world-lesson", { onLoad: setInstantDelays });
    cy.pytchHomeFromIDE();

    const createOptions = { resetDatabaseFirst: false };
    cy.pytchProjectFollowingTutorial("catch-apple", createOptions);
    cy.pytchHomeFromIDE();

    cy.pytchTryUploadZipfiles([
      "newly-created-per-method.zip",
      "simple-pytchjr-project.zip",
    ]);

    // We will now be at the "My projects" page.  Each test must ensure
    // that it leaves the app at the "My projects" page.
  });

  beforeEach(initSpecimenIntercepts);

  // #endregion

  ////////////////////////////////////////////////////////////////////////
  // #region Helpers

  const kMp3AssetName = "sine-1kHz-2s.mp3";
  const kPngAssetName = "red-rectangle-80-60.png";
  const kExpFlatAssetNames = [kPngAssetName, kMp3AssetName];

  // In the before() function, we set up the following projects:
  const kExpAllProjectNames = [
    "Untitled project",
    "Per-method test project",
    'My "catch-apple"',
    "Hello World Specimen",
    "Test seed project",
  ];

  const kPerMethodProjectIdx = 1;
  const kTutorialFollowingProjectIdx = 2;
  const kSpecimenLinkedProjectIdx = 3;
  const kFlatProjectIdx = 4;

  const projectName = (idx: number): string => kExpAllProjectNames[idx];

  // Assertions that we are at various pages and have no modals:

  const assertNoModals = () => cy.get(".modal").should("not.exist");

  const assertHomePageNoModals = () => {
    assertOnHomepage();
    assertNoModals();
  };

  function assertMyProjectsNoModals() {
    cy.get(".ProjectList h1").contains("My projects");
    assertNoModals();
  }

  function assertTutorialsNoModals() {
    cy.get(".TutorialList h1").contains("Tutorials");
    assertNoModals();
  }

  function assertProjectIdeNoModals() {
    cy.get("#pytch-stage-layers");
    assertNoModals();
  }

  // Navigation helpers:

  const navBack = () => cy.go("back");

  const openProjectByIdx = (idx: number): void => {
    cy.pytchOpenProject(projectName(idx));
    assertProjectIdeNoModals();
  };

  const goToMyProjectsAssertNoModals = () => {
    cy.get(".NavBar li").contains("My projects").click();
    assertMyProjectsNoModals();
  };

  const goToTutorialsAssertNoModals = () => {
    cy.get(".NavBar li").contains("Tutorials").click();
    assertTutorialsNoModals();
  };

  // Selection helpers for within the per-method IDE:

  const selectSnakeCode = () => {
    selectSprite("Snake");
    selectActorAspect("Code");
  };

  const selectSnakeCostumes = () => {
    selectSprite("Snake");
    selectActorAspect("Costumes");
  };

  // Machinery to describe a "navigating back abandons modal" test:

  // Which page should the test take place on:
  type PageIdentifier =
    | { kind: "my-projects" }
    | { kind: "ide"; projectIdx: number }
    | { kind: "tutorials" }
    | { kind: "specimen-linked-project" };

  // Type for bundle of functions to conduct the test, based on which
  // kind of page the test takes place on.  Declare these as function
  // properties rather than methods to get stricter type checking.
  // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-6.html#strict-function-types
  type AbandonmentTestFuncs = {
    goToPageUnderTest: (page: PageIdentifier) => void;
    returnToPageUnderTest: (page: PageIdentifier) => void;
    returnToMyProjects: () => void;
  };

  type AbandonmentTestFuncsFromKind = Record<
    PageIdentifier["kind"],
    AbandonmentTestFuncs
  >;

  // Bundles of functions for each page-kind:
  const abandonmentTestFuncsFromKind: AbandonmentTestFuncsFromKind = {
    "my-projects": {
      goToPageUnderTest: () => void 0, // Already on "My projects"
      returnToPageUnderTest: () => {
        assertHomePageNoModals();
        goToMyProjectsAssertNoModals();
      },
      returnToMyProjects: () => void 0, // Already on "My projects"
    },
    ide: {
      goToPageUnderTest: (page: PageIdentifier) => {
        if (page.kind !== "ide") throw new Error("bad page.kind");
        openProjectByIdx(page.projectIdx);
      },
      returnToPageUnderTest: (page: PageIdentifier) => {
        if (page.kind !== "ide") throw new Error("bad page.kind");
        assertMyProjectsNoModals();
        openProjectByIdx(page.projectIdx);
      },
      returnToMyProjects: () => {
        navBack();
        assertMyProjectsNoModals();
      },
    },
    tutorials: {
      goToPageUnderTest: () => goToTutorialsAssertNoModals(),
      returnToPageUnderTest: () => {
        assertMyProjectsNoModals();
        goToTutorialsAssertNoModals();
      },
      returnToMyProjects: () => {
        navBack();
        assertMyProjectsNoModals();
      },
    },
    "specimen-linked-project": {
      goToPageUnderTest: () => {
        openProjectByIdx(kSpecimenLinkedProjectIdx);
      },
      returnToPageUnderTest: () => {
        assertMyProjectsNoModals();
        openProjectByIdx(kSpecimenLinkedProjectIdx);
      },
      returnToMyProjects: () => {
        navBack();
        assertMyProjectsNoModals();
      },
    },
  };

  // Test-specific information:
  type ItCanAbandonDescriptor = {
    only?: boolean;
    page: PageIdentifier;
    runModal: () => void;
    afterwardsExpect?: () => void;
  };

  // Register a test that navigating back abandons a particular modal.
  function itCanAbandon(label: string, descr: ItCanAbandonDescriptor) {
    const createTest = descr.only ?? false ? it.only : it;

    createTest(label, () => {
      const page = descr.page;
      const funcs = abandonmentTestFuncsFromKind[page.kind];

      funcs.goToPageUnderTest(page);
      descr.runModal();
      navBack();
      funcs.returnToPageUnderTest(page);
      if (descr.afterwardsExpect != null) descr.afterwardsExpect();
      funcs.returnToMyProjects();
    });
  }

  // Common assertions, intended for use as the `afterwardsExpect`
  // property of a test.

  const assertProjectNamesUnchanged = () =>
    cy.pytchProjectNamesShouldDeepEqual(kExpAllProjectNames);

  const assertFlatAssetsUnchanged = () =>
    cy.pytchShouldShowAssets(kExpFlatAssetNames);

  const assertActorNamesUnchanged = () => assertActorNames(["Stage", "Snake"]);

  const assertSnakeCostumesUnchanged = () => {
    selectSnakeCostumes();
    assertCostumeNames(["python-logo.png"]);
  };

  const assertSnakeHatBlocksUnchanged = () => {
    selectSnakeCode();
    assertHatBlockLabels(["when green flag clicked"]);
  };

  // #endregion

  ////////////////////////////////////////////////////////////////////////
  // #region Tests

  itCanAbandon("create project", {
    page: { kind: "my-projects" },
    runModal: () => launchCreateProjectModal(),
  });

  itCanAbandon("upload zipfiles", {
    page: { kind: "my-projects" },
    runModal: () => cy.get("button").contains("Upload").click(),
    afterwardsExpect: assertProjectNamesUnchanged,
  });

  itCanAbandon("rename project", {
    page: { kind: "my-projects" },
    runModal: () =>
      launchProjectInListDropdownAction("Per-method test project", "Rename"),
    afterwardsExpect: assertProjectNamesUnchanged,
  });

  itCanAbandon("delete project", {
    page: { kind: "my-projects" },
    runModal: () =>
      launchProjectInListDropdownAction("Per-method test project", "DELETE"),
    afterwardsExpect: assertProjectNamesUnchanged,
  });

  itCanAbandon("delete many projects", {
    page: { kind: "my-projects" },
    runModal: () => {
      selectUniqueProject(projectName(0));
      selectUniqueProject(projectName(1));
      clickUniqueButton("DELETE");
    },
    afterwardsExpect: () => {
      // Slight abuse of this method to change app state (rather than
      // just assert some things).  We need to leave things as we found
      // them, by cancelling the multi-project selection:
      cy.get(".buttons.some-selected button.btn-primary").click();
      cy.pytchProjectNamesShouldDeepEqual(kExpAllProjectNames);
    },
  });

  itCanAbandon("add assets (flat)", {
    page: { kind: "ide", projectIdx: kFlatProjectIdx },
    runModal: launchAdd.assetFromThisDevice,
    afterwardsExpect: assertFlatAssetsUnchanged,
  });

  itCanAbandon("add clip art (flat)", {
    page: { kind: "ide", projectIdx: kFlatProjectIdx },
    runModal: () => {
      launchAdd.assetFromMediaLibrary();
      cy.get(".clipart-card").contains("blocks").click();
    },
    afterwardsExpect: assertFlatAssetsUnchanged,
  });

  itCanAbandon("delete asset (flat)", {
    page: { kind: "ide", projectIdx: kFlatProjectIdx },
    runModal: () => cy.pytchClickAssetDropdownItem(kMp3AssetName, "DELETE"),
    afterwardsExpect: assertFlatAssetsUnchanged,
  });

  itCanAbandon("rename asset (flat)", {
    page: { kind: "ide", projectIdx: kFlatProjectIdx },
    runModal: () => cy.pytchClickAssetDropdownItem(kMp3AssetName, "Rename"),
    afterwardsExpect: assertFlatAssetsUnchanged,
  });

  itCanAbandon("crop+scale image (flat)", {
    page: { kind: "ide", projectIdx: kFlatProjectIdx },
    runModal: () => cy.pytchClickAssetDropdownItem(kPngAssetName, "Crop/scale"),
    // TODO: Assert image-transform unchanged?
  });

  itCanAbandon("add sprite", {
    page: { kind: "ide", projectIdx: kPerMethodProjectIdx },
    runModal: launchAdd.sprite,
    afterwardsExpect: assertActorNamesUnchanged,
  });

  itCanAbandon("rename sprite", {
    page: { kind: "ide", projectIdx: kPerMethodProjectIdx },
    runModal: () => {
      launchRenameActorByIndex(1);
      cy.get(".modal-dialog input").type(`{selectAll}{del}Apples`);
    },
    afterwardsExpect: assertActorNamesUnchanged,
  });

  itCanAbandon("delete sprite", {
    page: { kind: "ide", projectIdx: kPerMethodProjectIdx },
    runModal: () => launchDeleteActorByIndex(1),
    afterwardsExpect: assertActorNamesUnchanged,
  });

  itCanAbandon("add script", {
    page: { kind: "ide", projectIdx: kPerMethodProjectIdx },
    runModal: () => {
      selectSnakeCode();
      launchAdd.script();
    },
    afterwardsExpect: assertSnakeHatBlocksUnchanged,
  });

  itCanAbandon("update script", {
    page: { kind: "ide", projectIdx: kPerMethodProjectIdx },
    runModal: () => {
      selectSnakeCode();
      cy.get(".HatBlock").contains("green flag clicked").dblclick();
      cy.get("div.modal.show").contains("when I start as a clone").click();
    },
    afterwardsExpect: assertSnakeHatBlocksUnchanged,
  });

  itCanAbandon("delete script", {
    page: { kind: "ide", projectIdx: kPerMethodProjectIdx },
    runModal: () => {
      selectSnakeCode();
      launchDeleteHandlerByIndex(0);
    },
    afterwardsExpect: assertSnakeHatBlocksUnchanged,
  });

  itCanAbandon("add assets (per-method)", {
    page: { kind: "ide", projectIdx: kPerMethodProjectIdx },
    runModal: () => {
      selectSnakeCostumes();
      launchAdd.assetFromThisDevice();
    },
  });

  itCanAbandon("rename asset (per-method)", {
    page: { kind: "ide", projectIdx: kPerMethodProjectIdx },
    runModal: () => {
      selectSnakeCostumes();
      launchRenameAssetByIndex(0);
    },
    afterwardsExpect: () => {
      selectSnakeCostumes();
      assertCostumeNames(["python-logo.png"]);
    },
  });

  itCanAbandon("delete asset (per-method)", {
    page: { kind: "ide", projectIdx: kPerMethodProjectIdx },
    runModal: () => {
      selectSnakeCostumes();
      launchDeleteAssetByIndex(0);
    },
    afterwardsExpect: assertSnakeCostumesUnchanged,
  });

  itCanAbandon("crop+scale image (per-method)", {
    page: { kind: "ide", projectIdx: kPerMethodProjectIdx },
    runModal: () => {
      selectSnakeCostumes();
      cy.get(".AssetCard button.dropdown-toggle").click();
      cy.get(".dropdown-item").contains("Crop/scale").click();
    },
    // TODO: Assert image-transform unchanged?
  });

  itCanAbandon("add clip art (per-method)", {
    page: { kind: "ide", projectIdx: kPerMethodProjectIdx },
    runModal: () => {
      selectSnakeCostumes();
      launchAdd.assetFromMediaLibrary();
      cy.get(".clipart-card").contains("blocks").click();
    },
    afterwardsExpect: assertSnakeCostumesUnchanged,
  });

  // Assume (hopefully that's not hubristic) that we don't have to test
  // all of the following three modals in both types of IDE.  Just
  // ensure both are covered.

  itCanAbandon("save project as", {
    page: { kind: "ide", projectIdx: kPerMethodProjectIdx },
    runModal: () => cy.pytchChooseDropdownEntry("Make a copy"),
  });

  itCanAbandon("download zipfile", {
    page: { kind: "ide", projectIdx: kFlatProjectIdx },
    runModal: () => cy.pytchChooseDropdownEntry("Download"),
  });

  itCanAbandon("display screenshot", {
    page: { kind: "ide", projectIdx: kPerMethodProjectIdx },
    runModal: () => cy.pytchChooseDropdownEntry("Screenshot"),
  });

  itCanAbandon("share tutorial", {
    page: { kind: "tutorials" },
    runModal: () => launchShareTutorialModal("Shoot the fruit"),
  });

  itCanAbandon("code diff help", {
    page: { kind: "ide", projectIdx: kTutorialFollowingProjectIdx },
    runModal: () => {
      jumpToTutorialChapter(2);
      cy.get(".patch-container .header button").eq(0).click();
      cy.contains("What changes should I make to my code?");
    },
  });

  itCanAbandon("view code diff", {
    page: { kind: "specimen-linked-project" },
    runModal: () => cy.get("button").contains("Compare to original").click(),
  });

  // #endregion
});
