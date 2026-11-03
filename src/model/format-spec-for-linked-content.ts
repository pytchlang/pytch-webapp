import { LinkedContentLoadingState } from "./project";
import { FormatSpecifier } from "./compound-text-input";
import { assertNever } from "../utils";
import {
  I18nStringSpecWithKeyPart,
  mkRawSpec,
  RawOrI18nStringSpec,
} from "./i18n/core-types";

const kUnlinkedSpecifierInitialValueSpec: RawOrI18nStringSpec = {
  kind: "i18n",
  spec: {
    ns: "projects",
    keyPart: "download-zipfile.name-initial-value.unlinked",
  },
};

const kUnlinkedSpecifierPlaceholderSpec: I18nStringSpecWithKeyPart = {
  ns: "projects",
  keyPart: "download-zipfile.name-placeholder.unlinked",
};

const kSpecimenSpecifierPlaceholderSpec: I18nStringSpecWithKeyPart = {
  ns: "projects",
  keyPart: "download-zipfile.name-placeholder.specimen",
};

export function filenameFormatSpecifier(
  loadState: LinkedContentLoadingState
): FormatSpecifier {
  const unlinkedSpecifier: FormatSpecifier = [
    {
      kind: "user-input",
      initialValue: kUnlinkedSpecifierInitialValueSpec,
      placeholder: kUnlinkedSpecifierPlaceholderSpec,
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
        case "flat-tutorial":
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
              initialValue: mkRawSpec(""),
              placeholder: kSpecimenSpecifierPlaceholderSpec,
            },
            { kind: "literal", value: literalFragment },
          ];
        }
        case "demo":
          return unlinkedSpecifier;
        default:
          return assertNever(content);
      }
    }
    default:
      return assertNever(loadState);
  }
}
