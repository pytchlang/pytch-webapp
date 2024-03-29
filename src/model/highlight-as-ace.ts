// Is there a cleaner way of getting at this types?
import { IAceEditorProps } from "react-ace";
type AceEditorT = Parameters<Required<IAceEditorProps>["onLoad"]>[0];
type AceRange = ReturnType<AceEditorT["getSelectionRange"]>;
type AceToken = ReturnType<AceEditorT["session"]["getTokens"]>[number];

const styleStringFromClass = (() => {
  // The following was manually extracted from the github theme CSS
  // within the Ace source.  Try to remember to check now and again that
  // it still matches.
  const defFromClass = new Map<string, string>([
    ["keyword", "/bold"],
    ["string", "#d14/"],
    ["variable.class", "teal/"],
    ["constant.numeric", "#099/"],
    ["function.support", "#0086b3/"],
    ["comment", "#998/italic"],
    ["variable.language", "#0086b3/"],
    ["keyword.operator", "/bold"],
    ["paren", "/bold"],
    ["boolean", "/bold"],
    ["variable.instance", "teal/"],
    ["constant.language", "/bold"],
  ]);

  let styleFromClass = new Map<string, string>();
  for (const [cls, def] of defFromClass.entries()) {
    const [colourStyle, fontStyle] = def.split("/");

    let styleString = "";
    if (colourStyle !== "") styleString += `color:${colourStyle};`;
    if (fontStyle === "bold") styleString += `font-weight:bold;`;
    if (fontStyle === "italic") styleString += `font-style:italic;`;

    styleFromClass.set(cls, styleString);
  }

  return styleFromClass;
})();

export function lineAsElement(tokens: Array<AceToken>) {
  let codeElt = document.createElement("code");
  for (const token of tokens) {
    let spanElt = document.createElement("span");
    spanElt.innerText = token.value;

    const maybeStyleString = styleStringFromClass.get(token.type);
    if (maybeStyleString != null)
      spanElt.setAttribute("style", maybeStyleString);

    codeElt.appendChild(spanElt);
  }

  return codeElt;
}

export const lineIntersectsSelection = (
  queryRow: number,
  selection: Array<AceRange>
) =>
  selection.some(
    (range) => queryRow >= range.start.row && queryRow <= range.end.row
  );
