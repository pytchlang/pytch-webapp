/// <reference types="cypress" />

context("Ask question and wait for answer", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  [
    {
      tag: "shown",
      startShown: true,
      questionSelector: ".speech-bubble",
      absentSelector: ".question-and-answer .prompt",
    },
    {
      tag: "hidden",
      startShown: false,
      questionSelector: ".question-and-answer .prompt",
      absentSelector: ".speech-bubble",
    },
  ].forEach((spec) =>
    it(`can ask questions sequentially (${spec.tag})`, () => {
      cy.pytchBuildCode(`
        import pytch

        class Interviewer(pytch.Sprite):
          Costumes = ["red-rectangle-80-60.png"]
          start_shown = ${spec.startShown ? "True" : "False"}

          @pytch.when_key_pressed("a")
          def conduct_interview(self):
            self.name = self.ask_and_wait_for_answer("name?")
            self.str_age = self.ask_and_wait_for_answer("age?")

          @pytch.when_key_pressed("b")
          def summarise_answers(self):
            self.show()
            self.say(f"Hi {self.name}; you are {self.str_age}")
      `);

      cy.pytchShouldHaveBuiltWithoutErrors();
      cy.get(spec.questionSelector).should("not.exist");
      cy.get(spec.absentSelector).should("not.exist");

      cy.pytchSendKeysToProject("a");
      cy.get(spec.absentSelector).should("not.exist");
      cy.get(spec.questionSelector).contains("name?");

      cy.pytchSendKeysToApp("Ben\n");
      cy.get(spec.absentSelector).should("not.exist");
      cy.get(spec.questionSelector).contains("age?");

      cy.pytchSendKeysToApp("47\n");
      cy.get(spec.questionSelector).should("not.exist");
      cy.get(spec.absentSelector).should("not.exist");

      cy.pytchSendKeysToProject("b");
      cy.get("div.speech-bubble").contains("Hi Ben; you are 47");
    })
  );
});
