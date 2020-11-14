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

  it("gives error for bad sound-name arg type", () => {
    cy.pytchBuildCode(`
      import pytch

      class Quiet(pytch.Sprite):
        Costumes = []
        Sounds = ["silence-500ms.mp3"]
        @pytch.when_key_pressed("a")
        def try_to_play_bad_sound(self):
          self.play_sound_until_done(lambda x: 42)
    `);

    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.pytchSendKeysToProject("a");

    cy.pytchShouldShowErrorCard("must be given a string");
  });

  it("gives error for unknown sound", () => {
    cy.pytchBuildCode(`
      import pytch

      class Quiet(pytch.Sprite):
        Costumes = []
        Sounds = ["silence-500ms.mp3"]
        @pytch.when_key_pressed("a")
        def try_to_play_bad_sound_0(self):
          self.try_to_play_bad_sound_1()
        def try_to_play_bad_sound_1(self):
          self.try_to_play_bad_sound_2()
        def try_to_play_bad_sound_2(self):
          self.play_sound_until_done("loud-noise")
    `);

    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.pytchSendKeysToProject("a");

    cy.pytchShouldShowErrorCard('could not find sound "loud-noise"');

    // From outermost in, should be:
    //
    // Quiet.try_to_play_bad_sound_0()
    // Quiet.try_to_play_bad_sound_1()
    // Quiet.try_to_play_bad_sound_2()
    // Actor.play_sound_until_done()
    cy.pytchShouldHaveErrorStackTraceOfLength(4);
  });
});
