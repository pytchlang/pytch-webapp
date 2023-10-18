// Inspired by but heavily modified from
// https://github.com/4teamwork/cypress-drag-drop

const dataTransfer = new DataTransfer();
const dragDropArgs = {
  dataTransfer,
  eventConstructor: "DragEvent",
  force: true,
};

type CyElementWrapper = Cypress.Chainable<JQuery<HTMLElement>>;

const DragSimulator = {
  init(
    sourceWrapper: Cypress.JQueryWithSelector,
    target: string | CyElementWrapper
  ) {
    this.source = cy.wrap(sourceWrapper.get(0));
    const wrappedTarget = typeof target === "string" ? cy.get(target) : target;
    return wrappedTarget.then((targetWrapper) => {
      this.target = cy.wrap(targetWrapper.get(0));
    });
  },

  dragstart() {
    return this.source.trigger("dragstart", dragDropArgs);
  },

  dragover() {
    this.target.trigger("dragover", dragDropArgs);
  },

  drop() {
    return this.target
      .trigger("drop", dragDropArgs)
      .then(() => this.source.trigger("dragend", dragDropArgs));
  },

  drag(
    sourceWrapper: Cypress.JQueryWithSelector,
    target: string | CyElementWrapper
  ) {
    this.init(sourceWrapper, target)
      .then(() => this.dragstart())
      .then(() => this.dragover())
      .then(() => this.drop());
  },
};

Cypress.Commands.add(
  "drag",
  { prevSubject: "element" },
  (prevSubject, targetAlias) => DragSimulator.drag(prevSubject, targetAlias)
);
