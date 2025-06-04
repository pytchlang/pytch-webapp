import { saveButton } from "../utils";
import {
  deleteAllCodeOfSoleHandler,
  loadFromZipfile,
  selectSprite,
  soleEventHandlerCodeShouldEqual,
  ScriptOps,
  settleModalDialog,
} from "./utils";

context("Edit Python of scripts", () => {
  it("focuses editor of newly-added script", () => {
    loadFromZipfile("newly-created-per-method.zip");
    selectSprite("Snake");
    ScriptOps.chooseHandlerDropdownItem(0, "DELETE");
    settleModalDialog("DELETE");
    ScriptOps.addHandler(ScriptOps.selectGreenFlagHatBlock);
    cy.pytchSendKeysToApp("# 42");
    soleEventHandlerCodeShouldEqual("# 42");
  });

  it("ignores INS key in script body editor", () => {
    loadFromZipfile("newly-created-per-method.zip");

    selectSprite("Snake");
    deleteAllCodeOfSoleHandler();

    cy.get(".ace_editor").type("# 012345{enter}");
    soleEventHandlerCodeShouldEqual("# 012345\n");

    cy.get(".ace_editor").type(
      "{upArrow}{home}{rightArrow}{rightArrow}A" +
        "{insert}{rightArrow}B{insert}{rightArrow}C" +
        "{insert}{rightArrow}D{insert}{rightArrow}E"
    );
    soleEventHandlerCodeShouldEqual("# A0B1C2D3E45\n");
  });

  it("launches autocomplete with electric dot", () => {
    loadFromZipfile("newly-created-per-method.zip");

    selectSprite("Snake");
    deleteAllCodeOfSoleHandler();

    cy.get(".ace_editor").type("pytch.");
    cy.get(".ace_autocomplete").should("be.visible");
    cy.pytchSendKeysToApp("{downArrow}{downArrow}{downArrow}{enter}");
    soleEventHandlerCodeShouldEqual("pytch.create_clone_of");

    cy.pytchSendKeysToApp("{enter}self.{enter}");
    soleEventHandlerCodeShouldEqual("pytch.create_clone_of\nself.all_clones");

    cy.pytchSendKeysToApp("{enter}rubbish.{enter}");
    soleEventHandlerCodeShouldEqual(
      "pytch.create_clone_of\nself.all_clones\nrubbish.\n"
    );
  });

  it("can edit code, updating Save button", () => {
    loadFromZipfile("per-method-four-scripts.zip");

    selectSprite("Snake");

    cy.get(".ace_editor").as("editors").should("have.length", 4);
    saveButton.click();

    saveButton.shouldReactToInteraction(() => {
      cy.get("@editors").eq(1).type("# Hello world testing");
    });
  });
});
