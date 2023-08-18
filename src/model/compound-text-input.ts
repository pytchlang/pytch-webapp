type UserInputFormatFragment = {
  kind: "user-input";
  initialValue: string;
  placeholder: string;
};

export type FormatFragment =
  | UserInputFormatFragment
  | { kind: "literal"; value: string };

export type FormatSpecifier = Array<FormatFragment>;
