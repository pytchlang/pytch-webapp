import {
  ActorKind,
  AssetMimeType,
  EventDescriptorKind,
  StructuredProgram,
} from "../../../src/model/junior/structured-program";
import { deIndent } from "../../common/utils";

import { IconName } from "@fortawesome/fontawesome-common-types";
import { AceControllerMap } from "../../../src/skulpt-connection/code-editor";
import { launchProjectInListDropdownAction } from "../utils";
import { Actions } from "easy-peasy";
import { IActiveProject } from "../../../src/model/project";
import { assertNever, range } from "../../../src/utils";
import { PytchAppStore } from "../../../src/store";

/** Click on the Sprite with the given `spriteName`, thereby selecting
 * it. */
export const selectSprite = (spriteName: string) =>
  cy.get(".ActorCard .label").contains(spriteName).click();

/** Click on the Stage, thereby selecting it. */
export const selectStage = () =>
  cy.get(".ActorCard .label").contains("Stage").click();

/** Assert that the given actor is selected. */
export function assertActorSelected(actorName: string) {
  cy.get(".ActorCard.isActive div.label")
    .should("have.length", 1)
    .should("have.text", actorName);
}

function selectPanelTab(containerClass: string, tabMatch: string) {
  cy.get(`.${containerClass} .nav-item`).as("tabs").contains(tabMatch).click();
  cy.get("@tabs")
    .find("button.active")
    .should("have.length", 1)
    .contains(tabMatch);
}

type ActorAspectTab = "Code" | "Costumes" | "Backdrops" | "Sounds";

/** Click on the given `tabLabel` within the Actor Aspects pane, thereby
 * selecting that tab.  */
export function selectActorAspect(
  tabLabel: ActorAspectTab,
  how: "tab" | "dropdown" = "tab"
) {
  switch (how) {
    case "tab":
      selectPanelTab("Junior-ActorProperties-container", tabLabel);
      break;
    case "dropdown": {
      const dropdownText = tabLabel.toLowerCase();
      cy.get(".ActorCard.isActive .dropdown").click();
      cy.get(".ActorCard.isActive .dropdown .dropdown-item")
        .contains(`Go to ${dropdownText}`)
        .click();
      break;
    }
  }
}

/** Assert that the given actor-property tab is active. */
export function assertActorAspectSelected(tabLabel: ActorAspectTab) {
  cy.get(".Junior-ActorProperties-container .nav-item button.active")
    .should("have.length", 1)
    .should("have.text", tabLabel);
}

/** Click on the given `tabLabel` within the Information pane, thereby
 * selecting that tab.  */
export function selectInfoPane(tabLabel: "Output" | "Errors") {
  selectPanelTab("Junior-InfoPanel-container", tabLabel);
}

function innerTextsMatch(selector: string, expInnerTexts: Array<string>) {
  if (expInnerTexts.length === 0) {
    return cy
      .get(selector)
      .should("not.exist")
      .then(() => true);
  } else {
    return cy.get(selector).then((elts: JQuery<HTMLElement>) => {
      const gotInnerTexts = elts.toArray().map((b) => b.innerText);
      return (
        gotInnerTexts.length === expInnerTexts.length &&
        gotInnerTexts.every(
          (text, idx) => text.toLowerCase() === expInnerTexts[idx].toLowerCase()
        )
      );
    });
  }
}

function assertInnerTexts(selector: string, expInnerTexts: Array<string>) {
  cy.waitUntil(() => innerTextsMatch(selector, expInnerTexts), {
    errorMsg: `exp ${expInnerTexts}`,
  });
}

/** Assert that the assert cards have labels whose texts are the decimal
 * representations of numbers from 0 up to one before the given
 * `nExpected`. */
export const assertCostumeIndexLabels = (nExpected: number) => {
  const expLabels = range(nExpected).map((n) => n.toString());
  assertInnerTexts(".AssetCard .asset-card-display-index", expLabels);
};

/** Assert that the tabs within the Actor Aspects pane have the given
 * array `expLabels` of labels. */
export const assertAspectTabLabels = (expLabels: Array<string>) =>
  assertInnerTexts(
    ".Junior-ActorProperties-container .nav-item button",
    expLabels
  );

/** Assert that the Hat Blocks of the scripts within the editor have the
 * given array `expLabels` of labels. */
export const assertHatBlockLabels = (expLabels: Array<string>) =>
  assertInnerTexts(".PytchScriptEditor .HatBlock .body .content", expLabels);

/** Type the given `text` into the script editor at (zero-based) index
 * `scriptIndex`. */
export const typeIntoScriptEditor = (scriptIndex: number, text: string) =>
  cy.get(".PytchScriptEditor").eq(scriptIndex).find(".ace_editor").type(text);

const assertAssetNames = (
  actorKind: ActorKind,
  assetKind: AssetMimeType,
  expNames: Array<string>
) => {
  const actorCls = `actor-kind-${actorKind}`;
  const assetCls = `asset-kind-${assetKind}`;
  const assetListSelector = `.Junior-AssetsList.${actorCls}.${assetCls}`;
  const selector = `${assetListSelector} .AssetCard .label`;
  assertInnerTexts(selector, expNames);
};

const assertAppearanceNames = (
  actorKind: ActorKind,
  expLabels: Array<string>
) => assertAssetNames(actorKind, "image", expLabels);

/** Assert that the currently-selected actor is a Sprite, and that its
 * Costumes have the given array `expNames` as their names. */
export const assertCostumeNames = (expNames: Array<string>) =>
  assertAppearanceNames("sprite", expNames);

/** Assert that the currently-selected actor is the Stage, and that its
 * Backdrops have the given array `expNames` as their names. */
export const assertBackdropNames = (expNames: Array<string>) =>
  assertAppearanceNames("stage", expNames);

/** Assert that the currently-selected actor's Sounds have the given
 * array `expNames` as their names. */
export const assertSoundNames = (
  actorKind: ActorKind,
  expNames: Array<string>
) => assertAssetNames(actorKind, "audio", expNames);

/** Assert that the current collection of actors has the given array
 * `expNames` as its names. */
export const assertActorNames = (expNames: Array<string>) =>
  assertInnerTexts(".ActorsList .ActorCard .label", expNames);

/** Assert that there is exactly one button matching `match`, then click
 * it. */
export const clickUniqueButton = (match: string) =>
  cy.get("button").contains(match).should("have.length", 1).click();

/** Assert that there is exactly one element matching `selector`, then
 * click it. */
export const clickUniqueSelected = (selector: string) =>
  cy.get(selector).should("have.length", 1).click();

export function settleModalDialog(buttonMatch: string): void;
export function settleModalDialog(settleAction: () => void): void;

/** Settle (i.e., proceed with or cancel) a modal dialog.  Assert that a
 * unique modal is currently showing, then 'settle' it based on the
 * given `buttonMatch_or_settleAction`.  If a string is given, assert
 * that a unique button with contents matching that string exists, and
 * then click it.  If a function is given, invoke that function.  Either
 * way, the modal should then cease to exist. */
export function settleModalDialog(
  buttonMatch_or_settleAction: string | (() => void)
): void {
  const settleAction =
    typeof buttonMatch_or_settleAction === "string"
      ? () => clickUniqueButton(buttonMatch_or_settleAction)
      : buttonMatch_or_settleAction;

  cy.assertCausesToVanish(".modal-dialog", settleAction);
}

/** Click the close button ("X") in the current modal dialog. */
export function clickHeaderCloseButton() {
  cy.get(".modal-header button.btn-close").click();
}

/** Compute whether the given `elem` is visible. */
export const elementIsVisible = (elem: HTMLElement) =>
  elem.getClientRects().length > 0;

/** Construct a `StructuredProgram` out of the given `protoProgram`.
 * Fudging the types, the given `protoProgram` must already be a
 * standard `StructuredProgram`, with the exception that the
 * `pythonCode` string of each `EventHandler` is allowed to have leading
 * blank lines, with the remaining lines having fixed arbitrary
 * indentation.  That fixed indentation is stripped to construct the
 * returned `StructuredProgram`.  (Any 'true' indentation in a
 * `pythonCode` string is preserved.) */
export const deIndentStructuredProgram = (
  protoProgram: StructuredProgram
): StructuredProgram => ({
  actors: protoProgram.actors.map((actor) => {
    const handlers = actor.handlers.map((handler) => {
      const pythonCode = deIndent(handler.pythonCode);
      return { ...handler, pythonCode };
    });
    return { ...actor, handlers };
  }),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const aceControllerMapFromWindow = (window: any): AceControllerMap =>
  window.PYTCH_CYPRESS.ACE_CONTROLLER_MAP;

/** Assert that there is only one event-handler in the controller-map,
 * and that it has the given `expCode` as its contents. */
export const soleEventHandlerCodeShouldEqual = (expCode: string): void => {
  cy.window().then((window) => {
    // This is similar to deleteAllCodeOfSoleHandler() below but
    // different enough that it's not worth extracting a function.
    const controllerMap = aceControllerMapFromWindow(window);
    const editorIds = controllerMap.nonSpecialEditorIds();
    cy.wrap(editorIds.length).should("equal", 1);
    const mController = controllerMap.get(editorIds[0]);
    if (mController == null) throw new Error("no controller");
    const soleCode = mController.value();
    cy.wrap(soleCode).should("equal", expCode);
  });
};

/** Get (as Cypress subject) the activity-bar tab with the given `icon`.
 * */
export const getActivityBarTab = (icon: IconName) =>
  cy.get(`.ActivityBarTab .tabkey-icon svg[data-icon="${icon}"]`);

export const renameProject = (currentNameMatch: string, newName: string) => {
  launchProjectInListDropdownAction(currentNameMatch, "Rename");
  cy.get("input").type("{selectAll}{del}");
  cy.get("input").type(newName);
  settleModalDialog("Rename");
};

/** Return a function which uses the demo mechanism to load a fixture
 * zipfile and run it.  The given `demoSlug` must be the stem of a
 * fixture zipfile, i.e., the file
 *
 * * `cypress/fixtures/project-zipfiles/${demoSlug}.zip`
 *
 * must exist.
 *
 * For use as a `before()` or `beforeEach()` function, e.g.,
 *
 * ```
 * beforeEach(loadAndRunDemo("lots-of-costumes"));
 * ```
 *  */
export const loadAndRunDemo = (demoSlug: string) => () => {
  // Initial ** is to match the fetched URL both when running
  // development server and when serving a deployment zipfile.
  cy.intercept("GET", `**/cypress/${demoSlug}.zip`, {
    fixture: `project-zipfiles/${demoSlug}.zip`,
  });
  cy.pytchResetDatabase({
    initialUrl: `/suggested-demo/cypress/${demoSlug}`,
  });
  cy.get("button").contains("Demo").click();
  cy.pytchGreenFlag();
};

type WithPytchJrProgramTestFun = (
  program: StructuredProgram,
  actions: Actions<IActiveProject>
) => void | Promise<void>;

/** Run the given function, providing it with the script-by-script
 * program as it is at that point in the test, and the actions for the
 * active project. */
export const usingPytchJrProgram = (fn: WithPytchJrProgramTestFun) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cy.window().then((window: any) => {
    let pytchCypress = window.PYTCH_CYPRESS;
    const store = pytchCypress.easyPeasyStore as PytchAppStore;

    const pytchProgram = store.getState().activeProject.project.program;
    if (pytchProgram.kind !== "per-method")
      throw new Error("usingPytchJrProgram(): expecting per-method program");

    const program = pytchProgram.program;
    const actions = store.getActions().activeProject;

    fn(program, actions);
  });
};

/** Assuming there is only one event-handler visible, delete all its
 * code. */
export const deleteAllCodeOfSoleHandler = () => {
  // Getting focus to the editor seems a bit race-prone.  Try this:
  cy.waitUntil(() => {
    cy.get(".ace_editor").click().type("{selectAll}{del}");
    return cy.window().then((window) => {
      const controllerMap = aceControllerMapFromWindow(window);
      const editorIds = controllerMap.nonSpecialEditorIds();
      if (editorIds.length !== 1) return false;
      const mController = controllerMap.get(editorIds[0]);
      if (mController == null) return false;
      const soleCode = mController.value();
      return soleCode === "";
    });
  });
};

/** Start with the webapp containing just a project created from the
 * given `zipName`, and open that project. */
export const loadFromZipfile = (zipName: string) => {
  cy.pytchResetDatabase();
  cy.pytchTryUploadZipfiles([zipName]);
  cy.get("div.modal.show").should("not.exist");
  cy.get(".NoContentHelp");
};

/** Collection of functions and constants for testing behaviour of the
 * script-by-script editor. */
export class ScriptOps {
  /** Assuming the "upsert handler" modal is open, type the given
   * `message` into the "When I receive" input box. */
  static typeMessageValue(message: string) {
    cy.get('li[data-event-handler-kind="message-received"]').click();
    cy.get("li.EventKindOption input").type(`{selectAll}{del}${message}`);
  }

  /** Launch the "add script" modal for the Snake sprite. */
  static launchAddHandler() {
    selectSprite("Snake");
    selectActorAspect("Code");
    launchAdd.script();
  }

  /** Add a script to the active actor.  The given
   * `activateDesiredKindFun` function should select the desired kind of
   * hat-block, and, if supplied, the given `doSubmitFun` function
   * should do the equivalent of clicking "Add". */
  static addHandler(
    activateDesiredKindFun: () => void,
    doSubmitFun?: () => void
  ) {
    ScriptOps.launchAddHandler();
    activateDesiredKindFun();
    if (doSubmitFun != null) {
      doSubmitFun();
    } else {
      settleModalDialog("OK");
    }
  }

  /** Click on the "green flag" hat block. */
  static selectGreenFlagHatBlock() {
    ScriptOps.selectHatBlock("green-flag");
  }

  /** Click on the hat block for the given event-kind. */
  static selectHatBlock(eventKind: EventDescriptorKind) {
    const match = (() => {
      switch (eventKind) {
        case "green-flag":
          return /when green flag clicked/;
        case "key-pressed":
          return /when .* key pressed/;
        case "message-received":
          return /when I receive/;
        case "start-as-clone":
          return /when I start as a clone/;
        case "clicked":
          return /when .* clicked/;
        default:
          return assertNever(eventKind);
      }
    })();

    cy.get("li.EventKindOption").contains(match).click();
  }

  /** Open the drop-down for the script at the given `scriptIndex` by
  clicking on the dropdown toggle. */
  static launchHandlerDropdown(scriptIndex: number) {
    cy.get(".PytchScriptEditor .HatBlock")
      .eq(scriptIndex)
      .find(".dropdown")
      .click();
  }

  /** Open the drop-down for the script at the given `scriptIndex`, and
   * click on the entry matching `itemMatch`. */
  static chooseHandlerDropdownItem(scriptIndex: number, itemMatch: string) {
    ScriptOps.launchHandlerDropdown(scriptIndex);
    cy.get(".dropdown-item").contains(itemMatch).click();
  }

  /** Add three sample scripts to the Snake sprite, for testing with.
   * If the test starts with the `newly-created-per-method` zipfile,
   * this will result in four scripts on the Snake sprite altogether. */
  static addSomeHandlers() {
    // Use a mixture of "OK" and double-click.

    ScriptOps.addHandler(() => ScriptOps.typeMessageValue("award-point"));

    // Using as() like this relies on addHandler() calling the
    // "activate" and "submit" functions in that order.
    ScriptOps.addHandler(
      () =>
        cy.get("li.EventKindOption").contains("clone").as("clone-hat").click(),
      () => cy.get("@clone-hat").dblclick()
    );

    ScriptOps.addHandler(() =>
      cy.get("li.EventKindOption").contains("this sprite").click()
    );
  }

  /** The expected list of hat-block labels after using
   * `addSomeHandlers()` on a project created from the
   * `newly-created-per-method` zipfile. */
  static readonly allExtendedHandlerLabels = [
    "when green flag clicked",
    'when I receive "award-point"',
    "when I start as a clone",
    "when this sprite clicked",
  ];

  /** A sublist (chosen by the given `idxs`) of the
   * `allExtendedHandlerLabels` list. */
  static someExtendedHandlerLabels(idxs: Array<number>) {
    return idxs.map((i) => ScriptOps.allExtendedHandlerLabels[i]);
  }
}

/** Assuming that we are in the per-method IDE, click one of the "add
 * something" buttons.  The arg `match` should be contained in the label
 * of the button to click. */
export const clickAddSomething = (match: string) =>
  cy
    .get(".IDELayout div.tab-pane.active .AddSomethingButton")
    .contains(match)
    .should("have.length", 1)
    .click();

const launchAddFun = (match: string) => () => clickAddSomething(match);

function assetFromThisDevice(fixtureBasenames: Array<string> = []) {
  const filenames = fixtureBasenames.map(
    (basename) => `sample-project-assets/${basename}`
  );

  clickAddSomething("Add from this device");
  cy.contains("Add to project").should("be.disabled");
  cy.get('.form-control[type="file"]').attachFile(
    filenames.map((filePath) => ({ filePath, encoding: "binary" }))
  );
}

/** Assuming that we are in the IDE, click, an "add something" button,
 * according to the function-valued property.  The functions take no
 * arguments, except for `assetFromThisDevice()`, which takes an
 * optional list of fixture basenames to attach to the file-chooser. */
export const launchAdd = {
  sprite: launchAddFun("Add sprite"),
  assetFromThisDevice,
  assetFromMediaLibrary: launchAddFun("Add from media library"),
  script: launchAddFun("Add script"),
};

/** Assuming that we are in the per-method IDE, launch the "add from
 * media library" modal dialog, and for each of the given `matches`,
 * select the matching card. */
export const initiateAddFromMediaLib = (matches: Array<string>) => {
  launchAdd.assetFromMediaLibrary();

  for (const match of matches) {
    // Sometimes the media library is scrolled such that the chosen
    // image is out of view.  Force Cypress to click it:
    cy.get(".clipart-card .clipart-name")
      .contains(match)
      .should("have.length", 1)
      .click({ force: true });
  }
};

/** Assuming that we are in the per-method IDE, launch the "add from
 * media library" modal dialog, select the card matching each of the
 * given `matches`, add add those assets. */
export const addFromMediaLib = (matches: Array<string>) => {
  initiateAddFromMediaLib(matches);
  const expButtonMatch = `Add ${matches.length}`;
  settleModalDialog(expButtonMatch);
};

/** Assuming that we are in the per-method IDE, with the Appearances
 * (i.e., Backdrops or Costumes) tab active, launch the context menu for
 * the appearance at the given `idx`. */
export const launchActorAssetDropdown = (idx: number) => {
  cy.get("div.tab-pane.active .AssetCard").eq(idx).find(".dropdown").click();
};

/** Assuming that we are in the per-method IDE, with the Appearances
 * (i.e., Backdrops or Costumes) tab active, launch the Delete modal for
 * the appearance at the given `idx`. */
export const launchDeleteAssetByIndex = (
  idx: number,
  appearanceName = "Costume"
) => {
  launchActorAssetDropdown(idx);
  cy.get(".dropdown-item").contains("DELETE").click();
  cy.get(".modal-header")
    .should("have.length", 1)
    .contains(`Delete the ${appearanceName}`);
};

/** Assuming that we are in the per-method IDE, with the Appearances
 * (i.e., Backdrops or Costumes) tab active, launch the Rename modal for
 * the appearance at the given `idx`. */
export const launchRenameAssetByIndex = (idx: number) => {
  launchActorAssetDropdown(idx);
  cy.get(".dropdown-item").contains("Rename").click();
  cy.get(".modal-header").should("have.length", 1).contains("Rename");
};

/** Assuming that we are in the per-method IDE, with the Appearances
 * (i.e., Backdrops or Costumes) tab active, launch the Crop/scale modal
 * for the appearance at the given `idx`. */
export const launchCropAssetByIndex = (idx: number) => {
  launchActorAssetDropdown(idx);
  cy.get(".dropdown-item").contains("Crop/scale").click();
  cy.get(".modal-header").should("have.length", 1).contains("Adjust image");
};

/** Assuming that we are in the per-method IDE, with the Appearances
 * (i.e., Backdrops or Costumes) tab active, use the appropriate context
 * menu item to move the appearance at the given `idx` one place in the
 * given `direction` in the ordering of appearances for that actor. */
export const doReorderAssetByIndex = (
  idx: number,
  direction: "earlier" | "later"
) => {
  launchActorAssetDropdown(idx);
  cy.get("div.show.dropdown .dropdown-item")
    .contains(`Move one place ${direction}`)
    .click();
};

/** Assuming that we are in the per-method IDE, launch the context menu
 * for the actor at the given `idx`. */
export const launchActorDropdown = (idx: number) => {
  cy.get("div.tab-pane.active .ActorCard").eq(idx).find(".dropdown").click();
};

/** Assuming that we are in the per-method IDE, launch the "rename"
 * action on the Actor at the given `idx` (which must be non-zero,
 * because it is impossible to rename the Stage).   */
export const launchRenameActorByIndex = (idx: number) => {
  launchActorDropdown(idx);
  cy.get(".dropdown-item.disabled").should("not.exist");
  cy.get(".dropdown-item").contains("Rename").click();
  cy.get(".modal-header").should("have.length", 1).contains("Rename");
};

/** Assuming that we are in the per-method IDE, launch the "delete"
 * action on the Actor at the given `idx` (which must be non-zero,
 * because it is impossible to delete the Stage).   */
export const launchDeleteActorByIndex = (idx: number) => {
  launchActorDropdown(idx);
  cy.get(".dropdown-item.disabled").should("not.exist");
  cy.get(".dropdown-item").contains("DELETE").click();
  cy.get(".modal-header").should("have.length", 1).contains("Delete");
};

/** Assuming that we are in the per-method IDE, with the Code tab
 * active, launch the "Delete Handler" modal for the script at the given
 * `idx`. */
export const launchDeleteHandlerByIndex = (idx: number) => {
  ScriptOps.chooseHandlerDropdownItem(idx, "DELETE");
  cy.get(".modal-header").should("have.length", 1).contains("Delete script?");
};

/** Assuming that we are in the per-method IDE, with the Code tab
 * active, perform the "Duplicate handler" action for the script at the
 * given `idx`. */
export const duplicateHandlerByIndex = (idx: number) => {
  ScriptOps.chooseHandlerDropdownItem(idx, "Duplicate");
};
