import React from "react";
import { makeScratchSVG } from "../../../model/scratchblocks-render";
import RawElement from "../../RawElement";

const elementIsCodeOfLanguage = (
  elt: HTMLElement,
  languageTag: string
): boolean => {
  const languageClass = `language-${languageTag}`;
  return (
    elt instanceof HTMLPreElement &&
    elt.firstChild instanceof HTMLElement &&
    elt.firstChild.tagName === "CODE" &&
    elt.firstChild.classList.contains(languageClass)
  );
};

export const elementIsScratchCode = (elt: HTMLElement) =>
  elementIsCodeOfLanguage(elt, "scratch");

type RawOrScratchBlockProps = { element: HTMLElement };
export const RawOrScratchBlock: React.FC<RawOrScratchBlockProps> = ({
  element,
}) => {
  if (elementIsScratchCode(element)) {
    const sbSvg = makeScratchSVG(element.innerText, 0.9);
    return <RawElement className="display-scratchblocks" element={sbSvg} />;
  } else {
    return <RawElement element={element} />;
  }
};
