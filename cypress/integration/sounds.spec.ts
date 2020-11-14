/// <reference types="cypress" />

context("Playing sounds", () => {
  const silenceAsset = [{ name: "silence-500ms.mp3", mimeType: "audio/mpeg" }];

  before(() => {
    cy.pytchExactlyOneProject(silenceAsset);
  });

  it("resumes after play-sound-until-done", () => {
    cy.pytchBuildCode(`
      import pytch

      class Quiet(pytch.Sprite):
        Costumes = []
        Sounds = ["silence-500ms.mp3"]
        @pytch.when_key_pressed("a")
        def emit_silence(self):
          self.play_sound_until_done("silence-500ms")
          print("finished being silent")
    `);

    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.pytchSendKeysToProject("a");
    cy.pytchStdoutShouldContain("finished");
  });
});
