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

/** Incrementally compute an array of pretty-printed lines by allowing
 * the client to push slices of code-lines and/or padding-lines.  Usage
 * protocol:
 *
 * ```
 * let builder = new ViewBuilder(richLines);
 *
 * // Sequence of mixture of:
 * builder.pushCodesLines(⋯);
 * builder.pushPadding(⋯);
 * // where the pushCodesLines() calls must between them
 * // consume all initially-provided richLines
 *
 * const prettyLines = builder.acquireLines();
 * ```
 */
class ViewBuilder<RichLineT> {
  richLines: Iterator<NumberedRichLine<RichLineT>>;
  viewLines: Array<PrettyPrintedLine<RichLineT>>;
  acquired = false;

  constructor(richLines: Array<NumberedRichLine<RichLineT>>) {
    this.richLines = richLines.values();
    this.viewLines = [];
  }

  /** Transfer `nLines` lines from `richLines` to the eventual output,
   * assigning them the given `kind`. */
  pushCodeLines(kind: CodeDiffHunk["kind"], nLines: number) {
    for (let i = 0; i !== nLines; ++i) {
      const nextResult = this.richLines.next();
      if (nextResult.done) {
        throw new Error("richLines exhausted early");
      }
      this.viewLines.push({ kind, ...nextResult.value });
    }
  }

  /** For positive `nLines`, add that many padding lines to the eventual
   * output, assigning them the given `kind`.  The line closest to the
   * middle of the new lines has the given `helpText`.  For non-positive
   * `nLines`, do nothing. */
  pushPadding(kind: PaddingKind, nLines: number, helpText: string) {
    // Allow calls where no padding is required:
    if (nLines <= 0) return;

    const helpTextIndex = Math.floor((nLines - 1) / 2);
    for (let i = 0; i !== nLines; ++i) {
      this.viewLines.push({
        kind,
        helpText: i === helpTextIndex ? helpText : "",
      });
    }
  }
}
