import { Action, action, thunk, Thunk } from "easy-peasy";
import scratchblocks from "scratchblocks";
import marked from "marked";
import { IPytchAppModel } from ".";
import { withinApp } from "../utils";

export type HeadingElementDescriptor = {
  kind: "heading";
  heading: string;
};

export type BlockElementDescriptor = {
  kind: "block";
  python: string;
  scratch: SVGElement;
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
 * Convert scratchblocks text `scratchText` into SVG element, scaling
 * down.  The containing DIV needs to be scaled similarly when the SVG
 * is inserted into the DOM in a `useEffect()` of the relevant
 * component.
 */
const makeScratchSVG = (scratchText: string): SVGElement => {
  const sbOptions = { style: "scratch3" };
  const sbDoc = scratchblocks.parse(scratchText, sbOptions);

  let sbSvg: SVGElement = scratchblocks.render(sbDoc, sbOptions);
  sbSvg.setAttribute("class", "scratchblocks");
  sbSvg.setAttribute(
    "style",
    `transform:scale(${scratchblocksScale});transform-origin:0 0;`
  );

  return sbSvg;
};

const makeBlockElementDescriptor = (raw: any): BlockElementDescriptor => {
  // Convert scratchblocks text into SVG element, scaling down.  The
  // containing DIV will be scaled similarly when the SVG is inserted
  // into the DOM in a useEffect() of the BlockElement component.
  const sbOptions = { style: "scratch3" };
  const sbDoc = scratchblocks.parse(raw.scratch, sbOptions);
  let sbSvg: SVGElement = scratchblocks.render(sbDoc, sbOptions);
  sbSvg.setAttribute("class", "scratchblocks");
  sbSvg.setAttribute(
    "style",
    `transform:scale(${scratchblocksScale});transform-origin:0 0;`
  );

  const helpHtml = marked(raw.help);
  const helpDoc = new DOMParser().parseFromString(helpHtml, "text/html");
  helpDoc.querySelectorAll("pre > code").forEach(simpleSyntaxHighlight);
  const helpElts = helpDoc.documentElement.querySelector("body")!.children;

  return {
    kind: "block",
    python: raw.python,
    scratch: sbSvg,
    help: helpElts,
    helpIsVisible: false,
  };
};

const makeNonMethodBlockElementDescriptor = (
  raw: any
): NonMethodBlockElementDescriptor => {
  const sbOptions = { style: "scratch3" };
  const sbDoc = scratchblocks.parse(raw.scratch, sbOptions);
  let sbSvg: SVGElement = scratchblocks.render(sbDoc, sbOptions);
  sbSvg.setAttribute("class", "scratchblocks");
  sbSvg.setAttribute(
    "style",
    `transform:scale(${scratchblocksScale});transform-origin:0 0;`
  );

  const helpHtml = marked(raw.help);
  const helpDoc = new DOMParser().parseFromString(helpHtml, "text/html");
  helpDoc.querySelectorAll("pre > code").forEach(simpleSyntaxHighlight);
  const helpElts = helpDoc.documentElement.querySelector("body")!.children;

  return {
    kind: "non-method-block",
    heading: raw.heading,
    scratch: sbSvg,
    python: raw.python,
    help: helpElts,
    helpIsVisible: false,
  };
};

export type HelpElementDescriptor =
  | HeadingElementDescriptor
  | BlockElementDescriptor
  | NonMethodBlockElementDescriptor;

const makeHelpElementDescriptor = (raw: any): HelpElementDescriptor => {
  switch (raw.kind as HelpElementDescriptor["kind"]) {
    case "heading":
      return raw as HeadingElementDescriptor;
    case "block":
      return makeBlockElementDescriptor(raw);
    case "non-method-block":
      return makeNonMethodBlockElementDescriptor(raw);
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
