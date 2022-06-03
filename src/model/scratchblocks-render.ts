import scratchblocks from "scratchblocks";

/**
 * Convert scratchblocks text `scratchText` into SVG element, with
 * scaling.  The containing DIV needs to be scaled similarly when the
 * SVG is inserted into the DOM in a `useEffect()` of the relevant
 * component.
 */
export const makeScratchSVG = (
  scratchText: string,
  scale: number
): SVGElement => {
  const sbOptions = { style: "scratch3" };
  const sbDoc = scratchblocks.parse(scratchText, sbOptions);

  let sbSvg: SVGElement = scratchblocks.render(sbDoc, sbOptions);
  sbSvg.setAttribute("class", "scratchblocks");
  sbSvg.setAttribute(
    "style",
    `transform:scale(${scale});transform-origin:0 0;`
  );

  return sbSvg;
};
