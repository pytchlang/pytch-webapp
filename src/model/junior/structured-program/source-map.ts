import { Uuid } from "./core-types";

/** Correspondence between
 *
 * * a contiguous chunk of lines in the flat representation of a
 *   program;
 * * the body of a particular individual handler within a particular
 *   individual actor, in the by-actor, by-script representation of that
 *   same program.
 *
 * Only the start line of the chunk is recorded.  (TODO: Consider adding
 * an (exclusive) `endLine` slot.) */
export type SourceMapEntry = {
  startLine: number;
  actorId: Uuid;
  handlerId: Uuid;
};

/** Description of a particular line of code within a particular handler
 * (in terms of the zero-based index of the line of code with the lines
 * of that handler) of a particular actor. */
export type LocationWithinHandler = {
  actorId: Uuid;
  handlerId: Uuid;
  lineWithinHandler: number;
};

/** A collection of `SourceMapEntry` correspondences, queryable in terms
 * of being able to find the handler (within some sprite) which
 * contributed a given line to the flat Python code. */
export class SourceMap {
  entries: Array<SourceMapEntry> = [];

  /** Set the array of `SourceMapEntry` instances within `this` to the
   * given `entries`, which must have strictly increasing `startLine`
   * property values. */
  setEntries(entries: Array<SourceMapEntry>): void {
    entries.forEach((entry, idx) => {
      if (idx > 0 && entry.startLine <= entries[idx - 1].startLine)
        throw new Error("startLine values must be strictly increasing");
    });

    this.entries = entries;
  }

  /** Given a zero-based `globalLine` index referring to a line in the
   * global, flat representation of a program, find the handler
   * containing that line, and return a `LocationWithinHandler` instance
   * describing the "local" location of the given line.  Throw an error
   * if there is no entry containing that line (which only happens if
   * either `entries` is empty, or the given line number is before the
   * `startLine` of the first entry). */
  localFromGlobal(globalLine: number): LocationWithinHandler {
    const entryIdx = this.entries.findLastIndex(
      (entry) => globalLine >= entry.startLine
    );
    if (entryIdx === -1)
      throw new Error(`line ${globalLine} is before any handler`);

    const entry = this.entries[entryIdx];

    return {
      actorId: entry.actorId,
      handlerId: entry.handlerId,
      lineWithinHandler: globalLine - entry.startLine,
    };
  }
}
