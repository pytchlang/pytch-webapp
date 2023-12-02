import { diffArrays } from "diff";

export type CodeDiffHunk =
  | { kind: "context"; commonLines: Array<string> }
  | { kind: "change"; aLines: Array<string>; bLines: Array<string> }
  | { kind: "add"; bLines: Array<string> }
  | { kind: "del"; aLines: Array<string> };

function linesFromText(text: string): Array<string> {
  return text === "" ? [] : text.split("\n");
}

export function diffFromTexts(
  textA: string,
  textB: string
): Array<CodeDiffHunk> {
  const aLines = linesFromText(textA);
  const bLines = linesFromText(textB);
  const diffs = diffArrays(aLines, bLines);

  // Collapse adjacent del/add pairs into one "change" hunk.  Prime the
  // hunks array with a pretend "context" hunk to simplify the loop.  We
  // discard this afterwards.
  let hunks: Array<CodeDiffHunk> = [{ kind: "context", commonLines: [] }];
  for (const diff of diffs) {
    const lastHunk = hunks[hunks.length - 1];
    if (diff.added && lastHunk.kind === "del") {
      const changeHunk: CodeDiffHunk = {
        kind: "change",
        aLines: lastHunk.aLines,
        bLines: diff.value,
      };
      hunks[hunks.length - 1] = changeHunk;
    } else {
      if (diff.added) {
        hunks.push({ kind: "add", bLines: diff.value });
      } else if (diff.removed) {
        hunks.push({ kind: "del", aLines: diff.value });
      } else {
        hunks.push({ kind: "context", commonLines: diff.value });
      }
    }
  }

  // Discard pretend hunk:
  hunks.shift();

  return hunks;
}

// The type parameter `RichLineT` in various of the below is to allow
// testing without having to drag in HTMLElement.

type NumberedRichLine<RichLineT> = {
  lineNumber: number;
  richLine: RichLineT;
};

type PrettyCodeLine<RichLineT> = {
  kind: CodeDiffHunk["kind"];
} & NumberedRichLine<RichLineT>;

type PaddingKind = "add-padding" | "change-padding" | "del-padding";

type PrettyPaddingLine = {
  kind: PaddingKind;
  helpText: string; // Can be empty
};

/** One line making up a pretty-printed display of a code diff.  Either
 * a "code line" or a "padding line". */
export type PrettyPrintedLine<RichLineT> =
  | PrettyCodeLine<RichLineT>
  | PrettyPaddingLine;
