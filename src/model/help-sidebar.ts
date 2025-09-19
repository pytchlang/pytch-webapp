import { Action, action, thunk, Thunk } from "easy-peasy";
import { makeScratchSVG } from "./scratchblocks-render";
import { marked } from "marked";
import { IPytchAppModel } from ".";
import { assertNever, failIfNull } from "../utils";
import { urlWithinApp } from "../env-utils";
import { PytchProgramKind, PytchProgramAllKinds } from "./pytch-program";
import {
  ActorKind,
  ActorKindOps,
  EventDescriptor,
  StructuredProgramOps,
} from "./junior/structured-program";
import { highlightedPreEltsFromCode } from "./highlight-as-ace";
import { useStoreState } from "../store";
import { DevWorkContext, DevWorkContextFlatKey } from "./dev-work-context";

export type ElementArray = Array<Element>;

export type HelpContentFromContext = Map<DevWorkContextFlatKey, ElementArray>;

export type PythonCodeFromKind = Map<PytchProgramKind, string>;

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
  eventDescriptor?: EventDescriptor;
  scratch: SVGElement;
  scratchIsLong: boolean;
  help: HelpContentFromContext;
  helpIsVisible: boolean;
};

export type NonMethodBlockElementDescriptor = HelpElementDescriptorCommon & {
  kind: "non-method-block";
  heading: string;
  scratch: SVGElement;
  python?: string;
  help: HelpContentFromContext;
  helpIsVisible: boolean;
};

export type PurePythonElementDescriptor = HelpElementDescriptorCommon & {
  kind: "pure-python";
  python: PythonCodeFromKind;
  help: HelpContentFromContext;
  helpIsVisible: boolean;
};

export const scratchblocksScale = 0.7;

export function showEntryInContext(
  forActorKinds: Array<ActorKind>,
  workContext: DevWorkContext
): boolean {
  switch (workContext.programKind) {
    case "flat":
      return true;
    case "per-method":
      return forActorKinds.includes(workContext.actorKind);
    default:
      return assertNever(workContext);
  }
}

/** Replace the given `codeElt` (in its parent) with a sequence of
 * children, one per line of the original `codeElt`'s text content.
 * Syntax highlighting is performed as Ace does it.
 */
const simpleSyntaxHighlight = (codeElt: Element): void => {
  const codeText = (codeElt.textContent ?? "").trimEnd();
  const codeLineElts = highlightedPreEltsFromCode(codeText);
  const preElt = failIfNull(codeElt.parentElement, "no parent");
  preElt.setAttribute("class", "help-sidebar-example-snippet");
  preElt.innerHTML = "";
  codeLineElts.forEach((elt) => preElt.appendChild(elt));
};

type RawHelpValue =
  | string
  | Record<string, string>
  | Record<string, Record<string, string>>;

const maybeApplyActorKindPrefix = (
  programKind: PytchProgramKind,
  helpContent: string,
  forActorKinds: Array<ActorKind>
): string => {
  switch (programKind) {
    case "flat":
      // In "flat" mode, all methods are shown, so we might need to
      // clarify which methods apply to only one actor-kind.
      if (forActorKinds.length === 2) {
        // Applicable to both Sprite and Stage; no prefix needed.
        return helpContent;
      } else {
        // Applicable to just one; add prefix.
        const actorKind = forActorKinds[0];
        const actorKindName = ActorKindOps.names(actorKind).displayTitle;
        const actorKindIntro = `**${actorKindName} only:** `;
        return actorKindIntro + helpContent;
      }
    case "per-method":
      return helpContent;
    default:
      return assertNever(programKind);
  }
};

/** Compute the MarkDown string to be used for the given `rawHelp`,
 * which is marked as being applicable to `forActorKinds`, when working
 * in the given `workContext`. */
const helpStringForContext = (
  rawHelp: RawHelpValue,
  forActorKinds: Array<ActorKind>,
  workContext: DevWorkContext
): string => {
  if (typeof rawHelp === "string") {
    // If we have a bare string, then it's the help to show whether
    // we're in "flat" or "per-method" mode.  (Possibly once we have
    // prefixed with, e.g., "Sprite only:".)
    return maybeApplyActorKindPrefix(
      workContext.programKind,
      rawHelp,
      forActorKinds
    );
  } else {
    const helpForProgramKind = failIfNull(
      rawHelp[workContext.programKind],
      `no help for "${workContext.programKind}"`
    );

    if (typeof helpForProgramKind === "string") {
      return maybeApplyActorKindPrefix(
        workContext.programKind,
        helpForProgramKind,
        forActorKinds
      );
    } else {
      switch (workContext.programKind) {
        case "flat":
          throw new Error('"flat" help must be string');
        case "per-method":
          return failIfNull(
            helpForProgramKind[workContext.actorKind],
            `no help for "per-method/${workContext.actorKind}"`
          );
        default:
          return assertNever(workContext);
      }
    }
  }
};

/** Convert the given `rawHelp`, which must be either:
 *
 * * a MarkDown string;
 * * an object with properties `flat` and `per-method`, where the value
 *   of the `flat` property is a MarkDown string, and the value of the
 *   `per-method` property is either:
 *     * a MarkDown string;
 *     * an object with properties `sprite` and `stage`, where the value
 *       of each of those properties is a MarkDown string.
 *
 * into a `HelpContentFromContext` map.
 */
const makeHelpContentLut = (
  rawHelp: RawHelpValue,
  forActorKinds: Array<ActorKind>
): HelpContentFromContext => {
  const helpEltsForContext = (workContext: DevWorkContext) =>
    makeHelpTextElements(
      helpStringForContext(rawHelp, forActorKinds, workContext)
    );

  const ctxFlat: DevWorkContext = { programKind: "flat" };
  const ctxPerMethodSprite: DevWorkContext = {
    programKind: "per-method",
    actorKind: "sprite",
  };
  const ctxPerMethodStage: DevWorkContext = {
    programKind: "per-method",
    actorKind: "stage",
  };

  const lut: HelpContentFromContext = new Map([
    ["flat", helpEltsForContext(ctxFlat)],
    ["per-method-sprite", helpEltsForContext(ctxPerMethodSprite)],
    ["per-method-stage", helpEltsForContext(ctxPerMethodStage)],
  ]);

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

type RawPythonCodeValue = string | Record<string, string>;

/** Convert the given `rawPython` (which must be either a string or an
 * object with properties whose names are `PytchProgramKind` values and
 * whose values are strings) into a `PythonCodeFromKind` map.
 */
const makePythonCodeLut = (
  rawPython: RawPythonCodeValue
): PythonCodeFromKind => {
  const pythonCodeForKind = (kind: PytchProgramKind): string => {
    if (typeof rawPython === "string") {
      return rawPython;
    } else {
      const mPythonCode = rawPython[kind];
      if (mPythonCode == null)
        throw new Error(
          `no Python for "${kind}" in ${JSON.stringify(rawPython)}`
        );
      return mPythonCode;
    }
  };

  return new Map<PytchProgramKind, string>(
    PytchProgramAllKinds.map((kind) => [kind, pythonCodeForKind(kind)])
  );
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
const makeBlockElementDescriptor = (raw: any): BlockElementDescriptor => {
  const forActorKinds = applicableActorKindsFromRaw(raw);
  return {
    kind: "block",
    forActorKinds,
    python: raw.python,
    eventDescriptor: raw.eventDescriptor,
    scratch: makeScratchSVG(raw.scratch, scratchblocksScale),
    scratchIsLong: raw.scratchIsLong ?? false,
    help: makeHelpContentLut(raw.help, forActorKinds),
    helpIsVisible: false,
  };
};

const makeNonMethodBlockElementDescriptor = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any
): NonMethodBlockElementDescriptor => {
  const forActorKinds = applicableActorKindsFromRaw(raw);
  return {
    kind: "non-method-block",
    forActorKinds,
    heading: raw.heading,
    scratch: makeScratchSVG(raw.scratch, scratchblocksScale),
    python: raw.python,
    help: makeHelpContentLut(raw.help, forActorKinds),
    helpIsVisible: false,
  };
};

const makePurePythonElementDescriptor = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any
): PurePythonElementDescriptor => {
  const forActorKinds = applicableActorKindsFromRaw(raw);
  return {
    kind: "pure-python",
    forActorKinds,
    python: makePythonCodeLut(raw.python),
    help: makeHelpContentLut(raw.help, forActorKinds),
    helpIsVisible: false,
  };
};

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
  sectionVisibility: SectionVisibility;

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
  sectionVisibility: sectionsCollapsed,

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
      // Can happen if the IDE renders before the help content loads.
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

export function useDevWorkContext(): DevWorkContext {
  return useStoreState((state) => {
    const program = state.activeProject.project.program;
    const programKind = program.kind;
    switch (programKind) {
      case "flat":
        return { programKind: "flat" };
      case "per-method": {
        const focusedActorId = state.jrEditState.focusedActor;
        const focusedActor = StructuredProgramOps.uniqueActorById(
          program.program,
          focusedActorId
        );
        const actorKind = focusedActor.kind;
        return { programKind: "per-method", actorKind };
      }
      default:
        return assertNever(programKind);
    }
  });
}
