import { assertNever } from "../utils";
import { PytchProgramKind } from "./pytch-program";

export type ProjectTemplateKind =
  | "bare-bones"
  | "with-sample-code"
  | "bare-per-method"
  | "simple-example-per-method";

export type WhetherExampleTag = "with-example" | "without-example";

// TODO: Replace above union of literals with this:
type ProjectTemplateKindAsComponents =
  `${WhetherExampleTag}/${PytchProgramKind}`;

// To the user, we're saying that "flat" or "per-method" is the "editor
// kind" rather than the "program kind", to lay the foundation for when
// we have a button we can press which converts programs from one form
// to another, giving the effect of editing "the same" program in two
// different ways.

export function templateKindFromComponents(
  whetherExample: WhetherExampleTag,
  editorKind: PytchProgramKind
): ProjectTemplateKind {
  const kind: ProjectTemplateKindAsComponents = `${whetherExample}/${editorKind}`;
  switch (kind) {
    case "with-example/flat":
      return "with-sample-code";
    case "with-example/per-method":
      return "simple-example-per-method";
    case "without-example/flat":
      return "bare-bones";
    case "without-example/per-method":
      return "bare-per-method";
    default:
      return assertNever(kind);
  }
}
