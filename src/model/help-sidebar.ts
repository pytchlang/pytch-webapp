import { Action, action, thunk, Thunk } from "easy-peasy";
import { IPytchAppModel } from ".";
import { withinApp } from "../utils";

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

  toggleHelpItemVisibility: Action<IHelpSidebar, number>;

  ensureHaveContent: Thunk<IHelpSidebar, void, {}, IPytchAppModel>;
  setRequestingContent: Action<IHelpSidebar>;
  setContentFetchError: Action<IHelpSidebar>;
  setContent: Action<IHelpSidebar, HelpContentDescriptor>;
}

export const helpSidebar: IHelpSidebar = {
  contentFetchState: { state: "idle" },
  isVisible: false,
  toggleVisibility: action((state) => {
    state.isVisible = !state.isVisible;
  }),

  toggleHelpItemVisibility: action((state, index) => {
    if (state.contentFetchState.state !== "available") {
      console.error("can not toggle help if content not available");
      return;
    }
    let entry = state.contentFetchState.content[index];
    if (entry.kind !== "block") {
      console.error("can not toggle help of a non-block");
      return;
    }
    entry.helpIsVisible = !entry.helpIsVisible;
  }),

  setRequestingContent: action((state) => {
    state.contentFetchState = { state: "requesting" };
  }),
  setContentFetchError: action((state) => {
    state.contentFetchState = { state: "error" };
  }),
  setContent: action((state, content) => {
    state.contentFetchState = { state: "available", content };
  }),
  ensureHaveContent: thunk(async (actions, _voidPayload, helpers) => {
    const state = helpers.getState();
    if (state.contentFetchState.state !== "idle") return;

    actions.setRequestingContent();

    try {
      const url = withinApp("/data/help-sidebar.json");
      const response = await fetch(url);
      const text = await response.text();
      const content = JSON.parse(text).map(makeHelpElementDescriptor);
      actions.setContent(content);
    } catch (err) {
      console.error("error fetching help sidebar content:", err);
      actions.setContentFetchError();
    }
  }),
};
