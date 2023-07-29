/// <reference types="cypress" />

context("Create project from specimen", () => {
  it("behaves correctly", () => {
    cy.intercept("GET", "**/hello-world-lesson.zip", {
      fixture: "lesson-specimens/hello-world-lesson.zip",
    });
    cy.intercept(
      "GET",
      "**/_by_content_hash_/" +
        "b7996f4c5671125f19c085a2102e8d673e8459109ff27daef4db652fe09e1663.zip",
      {
        fixture: "lesson-specimens/hello-world-lesson.zip",
      }
    );

    const lessonUrl = "/lesson/hello-world-lesson";

    const saveProject = () => cy.get("button.unsaved-changes-exist").click();

    const shouldEqualIds = (expIds: Array<number>) => ($li: JQuery) => {
      let gotIds = $li
        .toArray()
        .map((elt: HTMLElement) =>
          parseInt(elt.getAttribute("data-project-id"))
        );
      gotIds.sort((a, b) => a - b);

      expect(gotIds.length).eq(expIds.length);
      for (let i = 0; i != gotIds.length; ++i) {
        expect(gotIds[i]).eq(expIds[i]);
      }
    };
  });
});
