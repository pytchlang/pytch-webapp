import { Action, action } from "easy-peasy";

export type HeadingElementDescriptor = {
  kind: "heading";
  heading: string;
};

export type BlockElementDescriptor = {
  kind: "block";
  python: string;
  scratch: string; // TODO: Convert to Scratchblocks SVG
  help: string; // TODO: Convert to DOM element
  helpIsVisible: boolean;
};

const makeBlockElementDescriptor = (raw: any): BlockElementDescriptor => {
  return {
    kind: "block",
    python: raw.python,
    scratch: raw.scratch, // TODO: Convert to Scratchblocks SVG
    help: raw.help, // TODO: Convert to DOM element
    helpIsVisible: false,
  };
};

export type HelpElementDescriptor =
  | HeadingElementDescriptor
  | BlockElementDescriptor;

const makeHelpElementDescriptor = (raw: any): HelpElementDescriptor => {
  switch (raw.kind) {
    case "heading":
      return raw as HeadingElementDescriptor;
    case "block":
      return makeBlockElementDescriptor(raw);
    default:
      throw new Error(`unknown help element kind "${raw.kind}"`);
  }
};

export type HelpContentDescriptor = Array<HelpElementDescriptor>;

export type ContentFetchState =
  | { state: "idle" }
  | { state: "requesting" }
  | { state: "available"; content: HelpContentDescriptor }
  | { state: "error" };

export interface IHelpSidebar {
  contentFetchState: ContentFetchState;
  isVisible: boolean;
  toggleVisibility: Action<IHelpSidebar>;
}

export const helpSidebar: IHelpSidebar = {
  contentFetchState: { state: "idle" },
  isVisible: false,
  toggleVisibility: action((state) => {
    state.isVisible = !state.isVisible;
  }),
};
