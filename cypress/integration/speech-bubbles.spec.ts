/// <reference types="cypress" />

import { stageHalfWidth, stageHalfHeight } from "../../src/constants";

context("Speech bubbles", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  const stageLeft = (bubbleDiv: HTMLElement) =>
    bubbleDiv.offsetLeft - stageHalfWidth;
  const stageHorizontalCentre = (bubbleDiv: HTMLElement) =>
    bubbleDiv.offsetLeft + bubbleDiv.clientWidth / 2 - stageHalfWidth;
  const stageRight = (bubbleDiv: HTMLElement) =>
    bubbleDiv.offsetLeft + bubbleDiv.clientWidth - stageHalfWidth;
  const stageBottom = (bubbleDiv: HTMLElement) =>
    stageHalfHeight - (bubbleDiv.offsetTop + bubbleDiv.clientHeight);
  const stageTop = (bubbleDiv: HTMLElement) =>
    stageHalfHeight - bubbleDiv.offsetTop;

  class ExpectStagePosition {
    bubble: HTMLElement;

    constructor($div: JQuery<HTMLElement>) {
      expect($div.length).equal(1);
      this.bubble = $div.toArray()[0];
    }

    bottom(stageY: number) {
      expect(stageBottom(this.bubble)).equal(stageY);
      return this;
    }

    horizontalCentre(stageX: number) {
      expect(stageHorizontalCentre(this.bubble)).equal(stageX);
      return this;
    }
  }

  const expectStagePosition = ($div: JQuery<HTMLElement>) => {
    return new ExpectStagePosition($div);
  };

  it("shows a speech bubble", () => {
    cy.pytchBuildCode(`
      import pytch

      class Rectangle(pytch.Sprite):
        Costumes = ["red-rectangle-80-60.png"]

        @pytch.when_green_flag_clicked
        def go(self):
          self.go_to_xy(0, 24)
          self.say("Hello world!")
    `);
    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.pytchGreenFlag();
    cy.get("div.speech-bubble").contains("Hello world!");
  });
});
