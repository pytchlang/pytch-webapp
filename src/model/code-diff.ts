import { diffArrays } from "diff";
import { assertNever } from "../utils";

export type CodeDiffHunk =
  | { kind: "context"; commonLines: Array<string> }
  | { kind: "change"; aLines: Array<string>; bLines: Array<string> }
  | { kind: "add"; bLines: Array<string> }
  | { kind: "del"; aLines: Array<string> };

export type DiffViewKind = "bare-old" | "old-diff" | "new-diff";

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

  /** Retrieve the built array of pretty lines, verifying that all
   * initially-provided `richLines` have been transferred (by calls to
   * `pushCodeLines()`).  This method must not be called more than once
   * on a given `ViewBuilder` instance. */
  acquireLines() {
    if (!this.richLines.next().done) {
      throw new Error("did not consume all richLines");
    }
    if (this.acquired) {
      throw new Error("already acquired");
    }
    this.acquired = true;
    return this.viewLines;
  }
}

/** An enriched representation of the diff between some "old code" and
 * some "new code".  The function which performs the enrichment is
 * provided at construction time.  Three different views on the diff are
 * then available:
 *
 * * `viewBareOld()`: the old code, without any change markers or
 *   padding
 * * `viewOldDiff()`: the old code, with existing lines marked (if
 *   applicable) as to-be-deleted or to-be-changed, and with padding
 *   where to-be-added lines will go
 * * `viewNewDiff()`: the new code, with lines marked (if applicable) as
 *   was-added or was-changed, and with padding where was-deleted lines
 *   were
 *
 * Each such view is represented as an array of `PrettyPrintedLine`
 * objects.
 * */
export class EnrichedDiff<RichLineT> {
  oldRichLines: Array<NumberedRichLine<RichLineT>>;
  newRichLines: Array<NumberedRichLine<RichLineT>>;
  diffHunks: Array<CodeDiffHunk>;

  constructor(
    readonly oldCode: string,
    readonly newCode: string,
    enrich: (code: string) => Array<RichLineT>
  ) {
    const enrichAndNumber = (
      code: string
    ): Array<NumberedRichLine<RichLineT>> => {
      const richLines = enrich(code);
      // Convert from zero-based to one-based numbering:
      return richLines.map((richLine, idx) => {
        const lineNumber = idx + 1;
        return { lineNumber, richLine };
      });
    };

    this.oldRichLines = enrichAndNumber(oldCode);
    this.newRichLines = enrichAndNumber(newCode);
    this.diffHunks = diffFromTexts(oldCode, newCode);
  }

  /** A view of the diff showing the old code, without any change
   * markers or padding. */
  viewBareOld(): Array<PrettyPrintedLine<RichLineT>> {
    let builder = new ViewBuilder(this.oldRichLines);
    builder.pushCodeLines("context", this.oldRichLines.length);
    return builder.acquireLines();
  }

  /** A view of the diff showing the old code, with existing lines
   * marked (if applicable) as to-be-deleted or to-be-changed, and with
   * padding where to-be-added lines will go. */
  viewOldDiff(): Array<PrettyPrintedLine<RichLineT>> {
    // There is overlap with viewNewDiff() but it wasn't clear that
    // trying to unify the code would result in something simpler to
    // read.
    let builder = new ViewBuilder(this.oldRichLines);
    for (const hunk of this.diffHunks) {
      switch (hunk.kind) {
        case "del":
          builder.pushCodeLines("del", hunk.aLines.length);
          break;
        case "context":
          builder.pushCodeLines("context", hunk.commonLines.length);
          break;
        case "change": {
          builder.pushCodeLines("change", hunk.aLines.length);
          const nPad = hunk.bLines.length - hunk.aLines.length;
          builder.pushPadding("change-padding", nPad, "");
          break;
        }
        case "add": {
          const nPad = hunk.bLines.length;
          builder.pushPadding("add-padding", nPad, "[Add some code here]");
          break;
        }
        default:
          assertNever(hunk);
      }
    }
    return builder.acquireLines();
  }

  /** A view of the diff showing the new code, with existing lines
   * marked (if applicable) as was-added or was-changed, and with
   * padding where was-deleted lines were. */
  viewNewDiff(): Array<PrettyPrintedLine<RichLineT>> {
    // There is overlap with viewOldDiff() but it wasn't clear that
    // trying to unify the code would result in something simpler to
    // read.
    let builder = new ViewBuilder(this.newRichLines);
    for (const hunk of this.diffHunks) {
      switch (hunk.kind) {
        case "del": {
          const nPad = hunk.aLines.length;
          builder.pushPadding("del-padding", nPad, "[Code was deleted here]");
          break;
        }
        case "context":
          builder.pushCodeLines("context", hunk.commonLines.length);
          break;
        case "change": {
          builder.pushCodeLines("change", hunk.bLines.length);
          const nPad = hunk.aLines.length - hunk.bLines.length;
          builder.pushPadding("change-padding", nPad, "");
          break;
        }
        case "add":
          builder.pushCodeLines("add", hunk.bLines.length);
          break;
        default:
          assertNever(hunk);
      }
    }
    return builder.acquireLines();
  }
}
