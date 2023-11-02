import { PytchProgramKind } from "./pytch-program";

export type ProjectTemplateKind =
  | "bare-bones"
  | "with-sample-code"
  | "bare-per-method"
  | "simple-example-per-method";

export type WhetherExampleTag = "with-example" | "without-example";

type ProjectTemplateKindAsComponents =
  `${WhetherExampleTag}/${PytchProgramKind}`;
