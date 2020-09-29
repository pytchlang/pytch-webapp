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

    top(stageY: number) {
      expect(stageTop(this.bubble)).equal(stageY);
      return this;
    }

    // The x-coord tests require a small bit of tolerance, because sometimes
    // the true calculation will have a half-pixel discrepancy from what the
    // browser's layout engine comes up with.

    left(stageX: number) {
      expect(stageLeft(this.bubble)).approximately(stageX, 1.0);
      return this;
    }

    horizontalCentre(stageX: number) {
      expect(stageHorizontalCentre(this.bubble)).approximately(stageX, 1.0);
      return this;
    }

    right(stageX: number) {
      expect(stageRight(this.bubble)).approximately(stageX, 1.0);
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

    // The '54' here is the half-height of the image (60/2 = 30) plus
    // the y coord of the point we moved the rectangle to (24).
    cy.get("div.speech-bubble").then(($div) =>
      expectStagePosition($div).horizontalCentre(0).bottom(54)
    );
  });

  const clampingSpecs = [
    { label: "short", content: "Hello world" },
    {
      label: "long",
      content:
        "This is a longer speech bubble which should" +
        " wrap onto a few lines.  Hopefully it will work OK.",
    },
  ];

  clampingSpecs.forEach((spec) => {
    it(`clamps the speech bubble to the sides (${spec.label} content)`, () => {
      // The Python is a bit repetitive, but avoiding this would be
      // over-complicated.  The resulting project allows us to steer the
      // sprite around the screen while saying something, and we will
      // then measure where the bubble ends up.
      cy.pytchBuildCode(`
        import pytch

        class Rectangle(pytch.Sprite):
          Costumes = ["red-rectangle-80-60.png"]

          @pytch.when_key_pressed("0")
          def reset(self):
            self.say_nothing()

          @pytch.when_key_pressed("1")
          def set_small_jump(self):
            self.step_size = 20

          @pytch.when_key_pressed("2")
          def set_large_jump(self):
            self.step_size = 250

          @pytch.when_key_pressed("u")
          def move_up(self):
            self.change_y(self.step_size)
            self.say("${spec.content}")

          @pytch.when_key_pressed("d")
          def move_down(self):
            self.change_y(-self.step_size)
            self.say("${spec.content}")

          @pytch.when_key_pressed("l")
          def move_left(self):
            self.change_x(-self.step_size)
            self.say("${spec.content}")

          @pytch.when_key_pressed("r")
          def move_right(self):
            self.change_x(self.step_size)
            self.say("${spec.content}")
      `);
      cy.pytchShouldHaveBuiltWithoutErrors();

      // Helper function to check given properties of where the bubble
      // has ended up.
      const expectBubbleWithTipAt = (
        positionExpectations: (e: ExpectStagePosition) => void
      ) => {
        cy.get("div.speech-bubble").then(($div) => {
          const expectPosn = expectStagePosition($div);
          positionExpectations(expectPosn);
          cy.pytchSendKeysToProject("0");
          cy.get("div.speech-bubble").should("not.exist");
        });
      };

      // Move in a small dance; the bubble should stick to the sprite.
      cy.pytchSendKeysToProject("1u");
      expectBubbleWithTipAt((e) => e.horizontalCentre(0).bottom(50));
      cy.pytchSendKeysToProject("d");
      expectBubbleWithTipAt((e) => e.horizontalCentre(0).bottom(30));
      cy.pytchSendKeysToProject("l");
      expectBubbleWithTipAt((e) => e.horizontalCentre(-20).bottom(30));
      cy.pytchSendKeysToProject("rr");
      expectBubbleWithTipAt((e) => e.horizontalCentre(20).bottom(30));
      cy.pytchSendKeysToProject("l");
      expectBubbleWithTipAt((e) => e.horizontalCentre(0).bottom(30));

      // Move in a larger path; the bubble should get clamped to the
      // correct centre-of-edge or corner of the stage.
      cy.pytchSendKeysToProject("2u");
      expectBubbleWithTipAt((e) =>
        e.horizontalCentre(0).top(stageHalfHeight - 4)
      );
      cy.pytchSendKeysToProject("r");
      expectBubbleWithTipAt((e) =>
        e.right(stageHalfWidth - 4).top(stageHalfHeight - 4)
      );
      cy.pytchSendKeysToProject("d");
      expectBubbleWithTipAt((e) => e.right(stageHalfWidth - 4).bottom(30));
      cy.pytchSendKeysToProject("d");
      expectBubbleWithTipAt((e) =>
        e.right(stageHalfWidth - 4).bottom(-stageHalfHeight + 4)
      );
      cy.pytchSendKeysToProject("l");
      expectBubbleWithTipAt((e) =>
        e.horizontalCentre(0).bottom(-stageHalfHeight + 4)
      );
      cy.pytchSendKeysToProject("l");
      expectBubbleWithTipAt((e) =>
        e.left(-stageHalfWidth + 4).bottom(-stageHalfHeight + 4)
      );
      cy.pytchSendKeysToProject("u");
      expectBubbleWithTipAt((e) => e.left(-stageHalfWidth + 4).bottom(30));
      cy.pytchSendKeysToProject("u");
      expectBubbleWithTipAt((e) =>
        e.left(-stageHalfWidth + 4).top(stageHalfHeight - 4)
      );
      cy.pytchSendKeysToProject("r");
      expectBubbleWithTipAt((e) =>
        e.horizontalCentre(0).top(stageHalfHeight - 4)
      );
      cy.pytchSendKeysToProject("d");
      expectBubbleWithTipAt((e) => e.horizontalCentre(0).bottom(30));
    });
  });

  it("supports multiple sprites talking", () => {
    cy.pytchBuildCode(`
      import pytch

      class Alien(pytch.Sprite):
        Costumes = ["red-rectangle-80-60.png"]
        @pytch.when_green_flag_clicked
        def say_hello(self):
          self.go_to_xy(-100, 0)
          self.say("Hello from an Alien")

      class Earthling(pytch.Sprite):
        Costumes = ["red-rectangle-80-60.png"]
        @pytch.when_green_flag_clicked
        def say_hello(self):
          self.go_to_xy(100, 0)
          self.say("Hello from an Earthling")
    `);
    cy.pytchShouldHaveBuiltWithoutErrors();

    cy.pytchGreenFlag();
    cy.get("div.speech-bubble")
      .contains("Alien")
      .parent()
      .then(($div) =>
        expectStagePosition($div).horizontalCentre(-100).bottom(30)
      );
    cy.get("div.speech-bubble")
      .contains("Earthling")
      .parent()
      .then(($div) =>
        expectStagePosition($div).horizontalCentre(100).bottom(30)
      );
  });
});
