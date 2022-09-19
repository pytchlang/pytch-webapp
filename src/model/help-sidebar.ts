import { Action, action, thunk, Thunk } from "easy-peasy";
import { makeScratchSVG } from "./scratchblocks-render";
import { marked } from "marked";
import { IPytchAppModel } from ".";
import { withinApp } from "../utils";

export type HeadingElementDescriptor = {
  kind: "heading";
  sectionSlug: string;
  heading: string;
};

export type BlockElementDescriptor = {
  kind: "block";
  python: string;
  scratch: SVGElement;
  scratchIsLong: boolean;
  help: HTMLCollection;
  helpIsVisible: boolean;
};

export type NonMethodBlockElementDescriptor = {
  kind: "non-method-block";
  heading: string;
  scratch: SVGElement;
  python?: string;
  help: HTMLCollection;
  helpIsVisible: boolean;
};

export type PurePythonElementDescriptor = {
  kind: "pure-python";
  python: string;
  help: HTMLCollection;
  helpIsVisible: boolean;
};

export const scratchblocksScale = 0.7;

/**
 * Replace the given `codeElt` (in its parent) with a sequence of
 * children, one per line of the original `codeElt`'s text content.
 * Lines starting with the Python comment character `#` are given the
 * class `comment`.
 */
const simpleSyntaxHighlight = (codeElt: Element): void => {
  const codeText = codeElt.textContent ?? "";
  const codeLines = codeText.split("\n");
  const nLines = codeLines.length;
  const codeLineElts = codeLines.map((line, idx) => {
    const isLast = idx === nLines - 1;
    let lineElt = document.createElement("code");
    lineElt.innerText = line + (isLast ? "" : "\n");
    if (line.startsWith("#")) {
      lineElt.classList.add("comment");
    }
    return lineElt;
  });
  const preElt = codeElt.parentElement!;
  preElt.innerHTML = "";
  codeLineElts.forEach((elt) => preElt.appendChild(elt));
};

/**
 * Convert the given `helpMarkdown` text into an `HTMLCollection`.  Any
 * code blocks are mutated via `simpleSyntaxHighlight()` to allow
 * styling of comments.
 */
const makeHelpTextElements = (helpMarkdown: string): HTMLCollection => {
  const helpHtml = marked.parse(helpMarkdown);

  let helpDoc = new DOMParser().parseFromString(helpHtml, "text/html");
  helpDoc.querySelectorAll("pre > code").forEach(simpleSyntaxHighlight);

  const helpElts = helpDoc.documentElement.querySelector("body")!.children;

  return helpElts;
};

const makeBlockElementDescriptor = (raw: any): BlockElementDescriptor => ({
  kind: "block",
  python: raw.python,
  scratch: makeScratchSVG(raw.scratch, scratchblocksScale),
  scratchIsLong: raw.scratchIsLong ?? false,
  help: makeHelpTextElements(raw.help),
  helpIsVisible: false,
});

const makeNonMethodBlockElementDescriptor = (
  raw: any
): NonMethodBlockElementDescriptor => ({
  kind: "non-method-block",
  heading: raw.heading,
  scratch: makeScratchSVG(raw.scratch, scratchblocksScale),
  python: raw.python,
  help: makeHelpTextElements(raw.help),
  helpIsVisible: false,
});

const makePurePythonElementDescriptor = (
  raw: any
): PurePythonElementDescriptor => ({
  kind: "pure-python",
  python: raw.python,
  help: makeHelpTextElements(raw.help),
  helpIsVisible: false,
});

export type HelpElementDescriptor =
  | HeadingElementDescriptor
  | BlockElementDescriptor
  | NonMethodBlockElementDescriptor
  | PurePythonElementDescriptor;

const makeHelpElementDescriptor = (raw: any): HelpElementDescriptor => {
  switch (raw.kind as HelpElementDescriptor["kind"]) {
    case "heading":
      return raw as HeadingElementDescriptor;
    case "block":
      return makeBlockElementDescriptor(raw);
    case "non-method-block":
      return makeNonMethodBlockElementDescriptor(raw);
    case "pure-python":
      return makePurePythonElementDescriptor(raw);
    default:
      throw new Error(`unknown help element kind "${raw.kind}"`);
  }
};

export type HelpSectionContent = {
  sectionSlug: string;
  sectionHeading: string;
  entries: Array<HelpElementDescriptor>;
};

type HelpContent = Array<HelpSectionContent>;

const groupHelpIntoSections = (rawHelpData: Array<any>): HelpContent => {
  let currentSection: HelpSectionContent = {
    sectionSlug: "will-be-discarded",
    sectionHeading: "Will be discarded",
    entries: [],
  };

  let sections: Array<HelpSectionContent> = [];

  for (const datum of rawHelpData) {
    if (datum.kind === "heading") {
      sections.push(currentSection);
      currentSection = {
        sectionSlug: datum.sectionSlug,
        sectionHeading: datum.heading,
        entries: [],
      };
    } else {
      currentSection.entries.push(makeHelpElementDescriptor(datum));
    }
  }

  sections.push(currentSection);
  sections.splice(0, 1);

  return sections;
};

export type ContentFetchState =
  | { state: "idle" }
  | { state: "requesting" }
  | { state: "available"; content: HelpContent }
  | { state: "error" };

type SectionVisibility =
  | { status: "all-collapsed" }
  | { status: "one-visible"; slug: string };

type HelpEntryLocation = {
  sectionIndex: number;
  entryIndex: number;
};

export interface IHelpSidebar {
  contentFetchState: ContentFetchState;
  isVisible: boolean;
  sectionVisibility: SectionVisibility;
  toggleVisibility: Action<IHelpSidebar>;

  toggleHelpEntryVisibility: Action<IHelpSidebar, HelpEntryLocation>;
  hideSectionContent: Action<IHelpSidebar>;
  showSection: Action<IHelpSidebar, string>;
  toggleSectionVisibility: Thunk<IHelpSidebar, string>;

  ensureHaveContent: Thunk<IHelpSidebar, void, {}, IPytchAppModel>;
  setRequestingContent: Action<IHelpSidebar>;
  setContentFetchError: Action<IHelpSidebar>;
  setContent: Action<IHelpSidebar, HelpContent>;
}

const sectionsCollapsed: SectionVisibility = { status: "all-collapsed" };

export const helpSidebar: IHelpSidebar = {
  contentFetchState: { state: "idle" },
  isVisible: false,
  sectionVisibility: sectionsCollapsed,
  toggleVisibility: action((state) => {
    state.isVisible = !state.isVisible;
  }),

  toggleHelpEntryVisibility: action((state, entryLocation) => {
    if (state.contentFetchState.state !== "available") {
      console.error("can not toggle help if content not available");
      return;
    }
    let section = state.contentFetchState.content[entryLocation.sectionIndex];
    let entry = section.entries[entryLocation.entryIndex];

    if (!("helpIsVisible" in entry)) {
      console.error(`can not toggle help of "${entry.kind}" element`);
      return;
    }
    entry.helpIsVisible = !entry.helpIsVisible;
  }),

  hideSectionContent: action((state) => {
    state.sectionVisibility = sectionsCollapsed;
  }),
  showSection: action((state, sectionSlug) => {
    state.sectionVisibility = { status: "one-visible", slug: sectionSlug };
  }),
  toggleSectionVisibility: thunk((actions, sectionSlug, helpers) => {
    const sectionVisibility = helpers.getState().sectionVisibility;
    const targetIsCurrentlyExpanded =
      sectionVisibility.status === "one-visible" &&
      sectionVisibility.slug === sectionSlug;

    if (targetIsCurrentlyExpanded) {
      actions.hideSectionContent();
    } else {
      actions.showSection(sectionSlug);
    }
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
      const flatData = JSON.parse(text);
      const content = groupHelpIntoSections(flatData);
      actions.setContent(content);
    } catch (err) {
      console.error("error fetching help sidebar content:", err);
      actions.setContentFetchError();
    }
  }),
};
