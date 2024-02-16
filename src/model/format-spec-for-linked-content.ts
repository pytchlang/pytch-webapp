import { LinkedContentLoadingState } from "./project";
import { FormatSpecifier } from "./compound-text-input";
import { assertNever } from "../utils";

export function filenameFormatSpecifier(
  loadState: LinkedContentLoadingState
): FormatSpecifier {
  const unlinkedSpecifier: FormatSpecifier = [
    {
      kind: "user-input",
      initialValue: "pytch-project",
      placeholder: "filename",
    },
    { kind: "literal", value: ".zip" },
  ];

  switch (loadState.kind) {
    case "idle":
    case "pending":
    case "failed":
      return unlinkedSpecifier;
    case "succeeded": {
      const content = loadState.content;
      switch (content.kind) {
        case "none":
          return unlinkedSpecifier;
        case "jr-tutorial":
          // TODO: Is there something better to do here?
          return unlinkedSpecifier;
        case "specimen": {
          const lessonName = content.lesson.project.name;
          // An em-dash might cause Unicode-encoding problems, so use a
          // hyphen instead.
          const literalFragment = ` - ${lessonName}.zip`;
          return [
            {
              kind: "user-input",
              initialValue: "",
              placeholder: "your name",
            },
            { kind: "literal", value: literalFragment },
          ];
        }
        default:
          return assertNever(content);
      }
    }
    default:
      return assertNever(loadState);
  }
}
