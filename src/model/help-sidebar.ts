import { Action, action, thunk, Thunk } from "easy-peasy";
import { makeScratchSVG } from "./scratchblocks-render";
import { marked } from "marked";
import { IPytchAppModel } from ".";
import { failIfNull } from "../utils";
import { urlWithinApp } from "../env-utils";
import { PytchProgramKind, PytchProgramAllKinds } from "./pytch-program";
import { ActorKind } from "./junior/structured-program";

export type ElementArray = Array<Element>;

export type HelpContentFromKind = Map<PytchProgramKind, ElementArray>;

type HelpElementDescriptorCommon = {
  forActorKinds: Array<ActorKind>;
};

export type HeadingElementDescriptor = HelpElementDescriptorCommon & {
  kind: "heading";
  sectionSlug: string;
  heading: string;
};

export type BlockElementDescriptor = HelpElementDescriptorCommon & {
  kind: "block";
  python: string;
  scratch: SVGElement;
  scratchIsLong: boolean;
  help: HelpContentFromKind;
  helpIsVisible: boolean;
};

export type NonMethodBlockElementDescriptor = HelpElementDescriptorCommon & {
  kind: "non-method-block";
  heading: string;
  scratch: SVGElement;
  python?: string;
  help: HelpContentFromKind;
  helpIsVisible: boolean;
};

export type PurePythonElementDescriptor = HelpElementDescriptorCommon & {
  kind: "pure-python";
  python: string;
  help: HelpContentFromKind;
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
  const preElt = failIfNull(codeElt.parentElement, "no parent");
  preElt.innerHTML = "";
  codeLineElts.forEach((elt) => preElt.appendChild(elt));
};

type RawHelpValue = string | Record<string, string>;

/** Convert the given `rawHelp` (which must be either a MarkDown string
 * or an object with properties whose names are `PytchProgramKind`
 * values and whose values are MarkDown strings) into a
 * `HelpContentFromKind` map.
 */
const makeHelpContentLut = (rawHelp: RawHelpValue): HelpContentFromKind => {
  const helpStringForKind = (kind: PytchProgramKind): string => {
    if (typeof rawHelp === "string") {
      return rawHelp;
    }
    const mText = rawHelp[kind];
    if (mText == null)
      throw new Error(`no help for "${kind}" in ${JSON.stringify(rawHelp)}`);
    return mText;
  };

  const lut = new Map<PytchProgramKind, ElementArray>(
    PytchProgramAllKinds.map((kind) => [
      kind,
      makeHelpTextElements(helpStringForKind(kind)),
    ])
  );

  return lut;
};

/**
 * Convert the given `helpMarkdown` text into an `Array` of `Element`s.
 * Any code blocks are mutated via `simpleSyntaxHighlight()` to allow
 * styling of comments.
 */
const makeHelpTextElements = (helpMarkdown: string): ElementArray => {
  marked.use({ mangle: false, headerIds: false });
  const helpHtml = marked.parse(helpMarkdown);

  let helpDoc = new DOMParser().parseFromString(helpHtml, "text/html");
  helpDoc.querySelectorAll("pre > code").forEach(simpleSyntaxHighlight);

  // Convert the children HTMLCollection into an array to avoid an
  // intermittent bug whereby the help content was empty.  What seemed
  // to be happening was that the HTMLDocument helpDoc was GC'd, causing
  // the children of its <body> to become an empty HTMLCollection.
  const body = failIfNull(
    helpDoc.documentElement.querySelector("body"),
    "no body"
  );
  const helpElts = Array.from(body.children);

  return helpElts;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeHeadingElementDescriptor = (raw: any): HeadingElementDescriptor => ({
  ...raw,
});

const kBothActorKinds: Array<ActorKind> = ["sprite", "stage"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applicableActorKindsFromRaw = (raw: any): Array<ActorKind> => {
  const mKind = raw.actorKind;
  return mKind == null ? kBothActorKinds : [mKind as ActorKind];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeBlockElementDescriptor = (raw: any): BlockElementDescriptor => ({
  kind: "block",
  forActorKinds: applicableActorKindsFromRaw(raw),
  python: raw.python,
  scratch: makeScratchSVG(raw.scratch, scratchblocksScale),
  scratchIsLong: raw.scratchIsLong ?? false,
  help: makeHelpContentLut(raw.help),
  helpIsVisible: false,
});

const makeNonMethodBlockElementDescriptor = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any
): NonMethodBlockElementDescriptor => ({
  kind: "non-method-block",
  forActorKinds: applicableActorKindsFromRaw(raw),
  heading: raw.heading,
  scratch: makeScratchSVG(raw.scratch, scratchblocksScale),
  python: raw.python,
  help: makeHelpContentLut(raw.help),
  helpIsVisible: false,
});

const makePurePythonElementDescriptor = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any
): PurePythonElementDescriptor => ({
  kind: "pure-python",
  forActorKinds: applicableActorKindsFromRaw(raw),
  python: raw.python,
  help: makeHelpContentLut(raw.help),
  helpIsVisible: false,
});

export type HelpElementDescriptor =
  | HeadingElementDescriptor
  | BlockElementDescriptor
  | NonMethodBlockElementDescriptor
  | PurePythonElementDescriptor;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeHelpElementDescriptor = (raw: any): HelpElementDescriptor => {
  switch (raw.kind as HelpElementDescriptor["kind"]) {
    case "heading":
      return makeHeadingElementDescriptor(raw);
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  _toggleVisibility: Action<IHelpSidebar>;
  toggleVisibility: Thunk<IHelpSidebar>;

  toggleHelpEntryVisibility: Action<IHelpSidebar, HelpEntryLocation>;
  hideAllHelpEntries: Action<IHelpSidebar>;
  hideSectionContent: Action<IHelpSidebar>;
  showSection: Action<IHelpSidebar, string>;
  toggleSectionVisibility: Thunk<IHelpSidebar, string>;

  hideAllContent: Thunk<IHelpSidebar>;

  ensureHaveContent: Thunk<IHelpSidebar, void, void, IPytchAppModel>;
  setRequestingContent: Action<IHelpSidebar>;
  setContentFetchError: Action<IHelpSidebar>;
  setContent: Action<IHelpSidebar, HelpContent>;
}

const sectionsCollapsed: SectionVisibility = { status: "all-collapsed" };

export const helpSidebar: IHelpSidebar = {
  contentFetchState: { state: "idle" },
  isVisible: false,
  sectionVisibility: sectionsCollapsed,
  _toggleVisibility: action((state) => {
    state.isVisible = !state.isVisible;
  }),
  toggleVisibility: thunk((actions) => {
    actions._toggleVisibility();

    // Goal is to make sure that everything is collapsed when sidebar is
    // freshly opened; may as well do so on any change to visibility.
    actions.hideAllContent();
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
  hideAllHelpEntries: action((state) => {
    if (state.contentFetchState.state !== "available") {
      console.error("can not hide help entries if content not available");
      return;
    }
    for (let section of state.contentFetchState.content) {
      for (let entry of section.entries) {
        if (entry.kind !== "heading") {
          entry.helpIsVisible = false;
        }
      }
    }
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

  hideAllContent: thunk((actions) => {
    actions.hideAllHelpEntries();
    actions.hideSectionContent();
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
      const url = urlWithinApp("/data/help-sidebar.json");
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
