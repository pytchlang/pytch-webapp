import { assertNever } from "../utils";

type UserInputFormatFragment = {
  kind: "user-input";
  initialValue: string;
  placeholder: string;
};

export type FormatFragment =
  | UserInputFormatFragment
  | { kind: "literal"; value: string };

export type FormatSpecifier = Array<FormatFragment>;

export function uniqueUserInputFragment(
  formatSpecifier: Array<FormatFragment>
): UserInputFormatFragment {
  const uiFragments = formatSpecifier.filter(
    (fragment) => fragment.kind === "user-input"
  );
  if (uiFragments.length !== 1) {
    throw new Error(
      "expecting exactly one user-input fragment in specifier " +
        JSON.stringify(formatSpecifier)
    );
  }
  return uiFragments[0] as UserInputFormatFragment;
}

function fragmentValue(fragment: FormatFragment, userInputValue: string) {
  switch (fragment.kind) {
    case "user-input":
      return userInputValue;
    case "literal":
      return fragment.value;
    default:
      return assertNever(fragment);
  }
}

export function applyFormatSpecifier(
  spec: FormatSpecifier,
  userInputValue: string
) {
  return spec
    .map((fragment) => fragmentValue(fragment, userInputValue))
    .join("");
}
