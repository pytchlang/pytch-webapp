/// <reference types="cypress" />

context("Ask question and wait for answer", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  const speechBubble = () => cy.get(".speech-bubble");
  const questionPrompt = () => cy.get(".question-and-answer .prompt");

  const submitMethods = ["enter", "click"] as const;
  type SubmitMethod = typeof submitMethods[number];

  const submitQuestionAnswer = (answer: string, method: SubmitMethod) => {
    cy.pytchSendKeysToApp(answer);
    if (method === "enter") {
      cy.pytchSendKeysToApp("\n");
    } else {
      cy.get(".question-and-answer .check-icon").click();
    }
  };

  [
    {
      tag: "shown",
      startShown: true,
      questionSelectorFun: speechBubble,
      absentSelectorFun: questionPrompt,
    },
    {
      tag: "hidden",
      startShown: false,
      questionSelectorFun: questionPrompt,
      absentSelectorFun: speechBubble,
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
            self.name = self.ask_and_wait("name?")
            self.str_age = self.ask_and_wait("age?")

          @pytch.when_key_pressed("b")
          def summarise_answers(self):
            self.show()
            self.say(f"Hi {self.name}; you are {self.str_age}")
      `);

      cy.pytchShouldHaveBuiltWithoutErrors();
      spec.questionSelectorFun().should("not.exist");
      spec.absentSelectorFun().should("not.exist");

      cy.pytchSendKeysToProject("a");
      spec.absentSelectorFun().should("not.exist");
      spec.questionSelectorFun().contains("name?");

      submitQuestionAnswer("Ben", "click");
      spec.absentSelectorFun().should("not.exist");
      spec.questionSelectorFun().contains("age?");

      submitQuestionAnswer("47", "enter");
      spec.questionSelectorFun().should("not.exist");
      spec.absentSelectorFun().should("not.exist");
      cy.get("#pytch-speech-bubbles").should("be.focused");

      cy.pytchSendKeysToProject("b");
      speechBubble().contains("Hi Ben; you are 47");
    })
  );

  submitMethods.forEach((submitMethod) =>
    it(`can queue questions (${submitMethod})`, () => {
      cy.pytchBuildCode(`
        import pytch

        class Banana(pytch.Sprite):
          Costumes = []
          @pytch.when_key_pressed("b")
          def ask_question(self):
            name = self.ask_and_wait("name?")
            print(f"Hello, {name}!")

        class Orange(pytch.Sprite):
          Costumes = []
          @pytch.when_key_pressed("o")
          def ask_question(self):
            age = self.ask_and_wait("age?")
            print(f"You are {age}")
      `);

      cy.pytchShouldHaveBuiltWithoutErrors();

      // Trigger the Banana's question.
      cy.pytchSendKeysToProject("b");
      speechBubble().should("not.exist");
      questionPrompt().contains("name?");
      cy.pytchStdoutShouldEqual("");

      // Trigger the Orange's question; but nothing should change,
      // because the Banana is still waiting for its answer.  We need to
      // explicitly send the keys to the /project/, because the focus is
      // in the question/answer box.
      cy.pytchSendKeysToProject("o");
      speechBubble().should("not.exist");
      questionPrompt().contains("name?");
      cy.pytchStdoutShouldEqual("");

      // Direct focus back to answer box, then answer the "name?"
      // question.  Should see the output, and the next question in the
      // queue should appear.
      cy.get(".question-and-answer input").focus();
      submitQuestionAnswer("Ben", submitMethod);
      cy.pytchStdoutShouldEqual("Hello, Ben!\n");
      speechBubble().should("not.exist");
      questionPrompt().contains("age?");

      // Answer the "age?" question.  Should see the output, and no
      // further questions.
      submitQuestionAnswer("47", submitMethod);
      cy.get("#pytch-speech-bubbles").should("be.focused");

      cy.pytchStdoutShouldEqual("Hello, Ben!\nYou are 47\n");
      speechBubble().should("not.exist");
      questionPrompt().should("not.exist");
    })
  );

  it("resets question on opening project", () => {
    cy.pytchBuildCode(`
      import pytch

      class Interviewer(pytch.Sprite):
        Costumes = []
        @pytch.when_key_pressed("a")
        def conduct_interview(self):
          self.ask_and_wait("name?")
    `);

    cy.pytchSendKeysToProject("a");
    questionPrompt().contains("name?");

    cy.pytchSwitchProject("Test seed project");
    questionPrompt().should("not.exist");
  });

  it("resets question on red stop", () => {
    cy.pytchBuildCode(`
      import pytch

      class Interviewer(pytch.Sprite):
        Costumes = []
        @pytch.when_key_pressed("a")
        def conduct_interview(self):
          self.ask_and_wait("name?")
    `);

    cy.pytchSendKeysToProject("a");
    questionPrompt().contains("name?");

    cy.pytchRedStop();
    questionPrompt().should("not.exist");
  });
});
