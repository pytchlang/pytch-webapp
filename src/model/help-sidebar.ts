import { makeScratchSVG } from "./scratchblocks-render";
import { markedParse } from "../components/hooks/sync-marked";
import { assertNever, failIfNull } from "../utils";
import {
  kPytchProgramKindValues,
  PytchProgramKind,
} from "./pytch-program-types";
import {
  ActorKind,
  ActorKindOps,
  EventDescriptor,
} from "./junior/structured-program";
import { highlightedPreEltsFromCode } from "./highlight-as-ace";
import { useStoreState } from "../store";
import {
  DevWorkContext,
  DevWorkContextFlatKey,
  DevWorkContextOps,
} from "./dev-work-context";
import { activeActorKindSelector } from "../components/Junior/hooks";
import { kActorKindValues } from "./junior/structured-program/actor";
import { ExternalJsonSlice, externalJsonSlice } from "./external-json-data";
import { urlWithinApp } from "../env-utils";
import {
  HelpSidebarContentEntry,
  HelpSidebarBlockEntry,
  HelpSidebarNonMethodBlockEntry,
  HelpSidebarPurePythonEntry,
  HelpEntryContent,
  HelpPythonCode,
  zHelpSidebarContent,
} from "./help-sidebar-content";

export type ElementArray = Array<Element>;

export type HelpContentFromContext = Map<DevWorkContextFlatKey, ElementArray>;

type HelpElementDescriptorCommon = {
  forActorKinds: Array<ActorKind>;
};

export type HeadingElementDescriptor = HelpElementDescriptorCommon & {
  kind: "heading";
  sectionSlug: string;
  heading: string;
};

///////////////////////////////////////////////////////////////////////

type RichPythonFragment =
  | { kind: "literal"; value: string }
  | { kind: "meta-var"; name: string };

export type RichPython = Array<RichPythonFragment>;

export type RichPythonFromKind = Map<PytchProgramKind, RichPython>;

const parsedRichPython = (encoded: string): RichPython => {
  let tok = "";
  let insideBackticks = false;
  let fragments: RichPython = [];
  for (const ch of encoded) {
    if (ch === "`") {
      if (tok !== "") {
        const fragment: RichPythonFragment = insideBackticks
          ? { kind: "meta-var", name: tok }
          : { kind: "literal", value: tok };
        fragments.push(fragment);
      }
      insideBackticks = !insideBackticks;
      tok = "";
    } else {
      tok += ch;
    }
  }

  if (insideBackticks) {
    throw new Error("encoded rich Python ended inside backticks");
  }

  fragments.push({ kind: "literal", value: tok });

  return fragments;
};

const plainFromRich = (richPython: RichPython): string => {
  let plain = "";
  for (const frag of richPython) {
    switch (frag.kind) {
      case "literal":
        plain += frag.value;
        break;
      case "meta-var":
        plain += frag.name;
        break;
      default:
        return assertNever(frag);
    }
  }
  return plain;
};

///////////////////////////////////////////////////////////////////////

export type BlockElementDescriptor = HelpElementDescriptorCommon & {
  kind: "block";
  python: string;
  richPython: RichPython;
  eventDescriptor?: EventDescriptor;
  scratch: SVGElement;
  scratchIsLong: boolean;
  help: HelpContentFromContext;
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
  richPython: RichPythonFromKind;
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
  rawHelp: HelpEntryContent,
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
  rawHelp: HelpEntryContent,
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
  const helpHtml = markedParse(helpMarkdown);

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

/** Convert the given `rawPython` (which must be either a string or an
 * object with properties whose names are `PytchProgramKind` values and
 * whose values are strings) into a `PythonCodeFromKind` map.
 */
const makeRichPythonLut = (rawPython: HelpPythonCode): RichPythonFromKind => {
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

  const richPythonForKind = (kind: PytchProgramKind): RichPython => {
    return parsedRichPython(pythonCodeForKind(kind));
  };

  return new Map(
    kPytchProgramKindValues.map((kind) => [kind, richPythonForKind(kind)])
  );
};

const applicableActorKindsFromRaw = (
  raw: HelpSidebarContentEntry
): Array<ActorKind> => {
  // Only `block` entries can restrict themselves to a single
  // actor-kind; any other entry applies to both.
  const mKind = raw.kind === "block" ? raw.actorKind : null;
  return mKind == null ? kActorKindValues : [mKind];
};

const makeBlockElementDescriptor = (
  raw: HelpSidebarBlockEntry
): BlockElementDescriptor => {
  const forActorKinds = applicableActorKindsFromRaw(raw);
  const richPython = parsedRichPython(raw.python);
  const python = plainFromRich(richPython);
  return {
    kind: "block",
    forActorKinds,
    python,
    richPython,
    eventDescriptor: raw.eventDescriptor,
    scratch: makeScratchSVG(raw.scratch, scratchblocksScale),
    scratchIsLong: raw.scratchIsLong ?? false,
    help: makeHelpContentLut(raw.help, forActorKinds),
  };
};

const makeNonMethodBlockElementDescriptor = (
  raw: HelpSidebarNonMethodBlockEntry
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
  raw: HelpSidebarPurePythonEntry
): PurePythonElementDescriptor => {
  const forActorKinds = applicableActorKindsFromRaw(raw);
  return {
    kind: "pure-python",
    forActorKinds,
    richPython: makeRichPythonLut(raw.python),
    help: makeHelpContentLut(raw.help, forActorKinds),
    helpIsVisible: false,
  };
};

export type HelpElementDescriptor =
  | HeadingElementDescriptor
  | BlockElementDescriptor
  | NonMethodBlockElementDescriptor
  | PurePythonElementDescriptor;

const makeHelpElementDescriptor = (
  raw: HelpSidebarContentEntry
): HelpElementDescriptor => {
  switch (raw.kind) {
    case "block":
      return makeBlockElementDescriptor(raw);
    case "non-method-block":
      return makeNonMethodBlockElementDescriptor(raw);
    case "pure-python":
      return makePurePythonElementDescriptor(raw);
    default:
      return assertNever(raw);
  }
};

export type HelpSectionContent = {
  sectionSlug: string;
  sectionHeading: string;
  entries: Array<HelpElementDescriptor>;
};

type HelpContent = Array<HelpSectionContent>;

const groupHelpIntoSections = (rawHelpData: unknown): HelpContent => {
  const helpData = zHelpSidebarContent.parse(rawHelpData);

  let currentSection: HelpSectionContent = {
    sectionSlug: "will-be-discarded",
    sectionHeading: "Will be discarded",
    entries: [],
  };

  let sections: Array<HelpSectionContent> = [];

  for (const entry of helpData) {
    if (entry.kind === "heading") {
      sections.push(currentSection);
      currentSection = {
        sectionSlug: entry.sectionSlug,
        sectionHeading: entry.heading,
        entries: [],
      };
    } else {
      currentSection.entries.push(makeHelpElementDescriptor(entry));
    }
  }

  sections.push(currentSection);
  sections.splice(0, 1);

  return sections;
};

////////////////////////////////////////////////////////////////////////

export type IHelpSidebar = ExternalJsonSlice<HelpContent>;
export const helpSidebar = externalJsonSlice(
  () => urlWithinApp("/data/help-sidebar.json"),
  groupHelpIntoSections
);

export function useDevWorkContext(): DevWorkContext {
  return useStoreState((state) => {
    const program = state.activeProject.project.program;
    const programKind = program.kind;
    switch (programKind) {
      case "flat":
        return { programKind: "flat" };
      case "per-method": {
        const actorKind = activeActorKindSelector(state);
        return { programKind: "per-method", actorKind };
      }
      default:
        return assertNever(programKind);
    }
  }, DevWorkContextOps.eq);
}
