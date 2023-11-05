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
