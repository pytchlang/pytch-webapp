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
