import { assertNever } from "../utils";
import { PytchProgramKind } from "./pytch-program";

export type ProjectTemplateKind =
  | "bare-bones"
  | "with-sample-code"
  | "bare-per-method"
  | "simple-example-per-method";

export type WhetherExampleTag = "with-example" | "without-example";

type ProjectTemplateKindAsComponents =
  `${WhetherExampleTag}/${PytchProgramKind}`;

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
