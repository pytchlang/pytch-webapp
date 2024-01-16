import {
  ArrayRGBA,
  ContentMatch,
  PytchErrorKind,
  ResetDatabaseOptions,
} from "./types";

declare global {
  namespace Cypress {
    interface Chainable {
      /** Reset the "pytch" storage database to be empty apart from one
       * project, which by default has one sample image asset and one
       * sample sound asset.  Additional assets can be passed in if
       * required via `options`. */
      pytchResetDatabase(options?: ResetDatabaseOptions): Chainable<Element>;

      /** Reset the "pytch" storage database, then navigate to the sole
       * project created as part of the seeding.  Extra assets to be
       * loaded into the seed project can be passed in if required. */
      pytchExactlyOneProject(
        resetDatabaseOptions?: ResetDatabaseOptions
      ): Chainable<Element>;

      /** Reset the "pytch" db, then create a PytchJr project from the
       * basic sample, and navigate to it. */
      pytchBasicJrProject(): void;

      /** Reset the "pytch" db, then create a PytchJr project following
       * the "catch apple jr" tutorial and navigate to it. */
      pytchJrLesson(): void;

      /** Open the project matching the given name, assuming we are
       * currently on the "My Projects" page. */
      pytchOpenProject(name: string): Chainable<Element>;

      /** Attempt to upload the zipfiles with the given basenames. */
      pytchTryUploadZipfiles(zipBasenames: Array<string>): void;

      /** Assert that the list of project names is as expected. */
      pytchProjectNamesShouldDeepEqual(expectedNames: Array<string>): void;

      /** Assuming we are currently working in the IDE, go to the app's
       * home page. */
      pytchHomeFromIDE(): void;

      /** Assuming we are currently working in the IDE, switch to the
       * project with the given name. */
      pytchSwitchProject(name: string): Chainable<Element>;

      /** Reset the "pytch" storage database, then create and navigate to
       * a project following a sample tutorial. */
      pytchProjectFollowingTutorial(
        tutorialMatch?: string,
        tutorialSlug?: string
      ): Chainable<Element>;

      /** Reset the "pytch" storage database, then create and navigate to
       * a project created as a demo of a sample tutorial. */
      pytchProjectDemonstratingTutorial(
        tutorialMatch?: string,
        tutorialSlug?: string
      ): Chainable<Element>;

      /** Assert that the IDE currently displays the "Images and sounds"
       * tab in the info pane, and that the listed assets have the given
       * names, in the given order. */
      pytchShouldShowAssets(expectedNames: Array<string>): Chainable<Element>;

      /** Set focus to the Ace editor. */
      pytchFocusEditor(): void;

      /** Set the code directly to the given `codeText`. */
      pytchSetCodeRaw(codeText: string): void;

      /** Set the code to the result of de-indenting the given text. */
      pytchSetCodeWithDeIndent(indentedCodeText: string): void;

      /** Build the current state of the project via the BUILD button. */
      pytchBuild(): Chainable<Element>;

      /** Set the code-editor's content to the given code (after
       * de-indenting it), and then build the project.  This may result in
       * build errors, or in a successfully-built project. */
      pytchBuildCode(rawCode: string): Chainable<Element>;

      /** Assert that the code editor of the IDE contains exactly the given code. */
      pytchCodeTextShouldEqual(expectedCode: string): void;

      /** Assert that the code editor of the IDE contains code containing
       * the given match. */
      pytchCodeTextShouldContain(match: string): Chainable<Element>;

      /** Assert that the "Output" pane contains the given match. */
      pytchStdoutShouldContain(match: string): Chainable<Element>;

      /** Assert that the "Output" pane equals the given match. */
      pytchStdoutShouldEqual(match: string): Chainable<Element>;

      /** Assert that the canvas is showing the given colour over the
       * entirety of the stage area. */
      pytchCanvasShouldBeSolidColour(expectedColour: ArrayRGBA): void;

      /** Assert that the "Errors" pane is not active, and that it is
       * devoid of error reports. */
      pytchShouldHaveBuiltWithoutErrors(): Chainable<Element>;

      /** Assert that the "Errors" pane is active and contains
       * introductory (i.e., context-setting) text satisfying the
       * given match. */
      pytchShouldShowErrorContext(match: ContentMatch): Chainable<Element>;

      /** Assert that the "Errors" pane is active and contains an error
       * card satisfying the given match, of the given kind (user-space
       * or Pytch-internal).  (The optional `infoPanelClass` parameter
       * is for internal use.)*/
      pytchShouldShowErrorCard(
        match: ContentMatch,
        kind: PytchErrorKind,
        infoPanelClass?: string
      ): Chainable<Element>;

      /** Assert that, within the Junior IDE, the "Errors" pane is
       * active and contains an error card satisfying the given match,
       * of the given kind (user-space or Pytch-internal). */
      pytchShouldShowJuniorErrorCard(
        match: ContentMatch,
        kind: PytchErrorKind
      ): Chainable<Element>;

      /** Assert that the "Errors" pane is active and contains a stack
       * trace having the given number of frame summaries. */
      pytchShouldHaveErrorStackTraceOfLength(
        nFrames: number
      ): Chainable<Element>;

      /** Click the green flag. */
      pytchGreenFlag(): Chainable<Element>;

      /** Click the red stop. */
      pytchRedStop(): Chainable<Element>;

      /** Within the IDE, choose the given entry from the drop-down menu. */
      pytchChooseDropdownEntry(entryName: string): Chainable<void>;

      /** Send keypresses to the running project. */
      pytchSendKeysToProject(keys: string): Chainable<Element>;

      /** Click on stage at given STAGE coordinates (e.g., (0, 0) is centre). */
      pytchClickStage(stageX: number, stageY: number): Chainable<Element>;

      /** Send keypresses to the currently-focussed element of the web-app. */
      pytchSendKeysToApp(keys: string): Chainable<Element>;

      /** Resize the stage to achieve the given increase in height. */
      pytchDragStageDivider(sizeIncrease: number): void;

      /** Assert that the Build / Green-flag tooltips behave while the
       * user clicks through the button tour. */
      pytchRunThroughButtonTour(): Chainable<Element>;

      /** Activate the drop-down menu for the asset with the given
       * `assetName`.  Optionally, run the given `maybeChooseItem`
       * function once the dropdown appears. */
      pytchActivateAssetDropdown(
        assetName: string,
        maybeChooseItem?: () => void
      ): Chainable<void>;

      /** Activate the drop-down menu for the asset with the given
       * `assetName` and then click on the item with the given `itemName`
       * once the drop-down appears. */
      pytchClickAssetDropdownItem(
        assetName: string,
        itemName: string
      ): Chainable<void>;

      /** Assert that, initially, the given `selector` finds a visible element;
       * the given `actionFun` is then invoked, after which the given
       * `selector` should select no elements.  Useful for asserting
       * that a given action dismisses a modal element. */
      assertCausesToVanish(selector: string, actionFun: () => void): void;

      /** Simulate a drag of the target element to the given `target`,
       * which can either be the result of a Cypress function giving a
       * subject, or a selector string, in which case the first element
       * matching that selector is used. */
      drag(selector: string | Cypress.Chainable<JQuery<HTMLElement>>): void;
    }
  }
}
