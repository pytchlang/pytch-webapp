// Conversion of structured program into flat Python code.

import { Actor, ActorKindOps } from "./actor";
import { AssetMetaData, AssetMetaDataOps } from "./asset";
import { EventDescriptorOps } from "./event";
import { StructuredProgram } from "./program";
import { SourceMapEntry } from "./source-map";

/** The result of converting a structured program into one flat Python
 * program:
 *
 * * `codeText` — the flat Python program;
 * * `mapEntries` — an array of correspondences between the individual
 *   handlers of the individual actors in the structured program and
 *   contiguous chunks of lines in the resulting flat program.
 */
export type FlattenResults = {
  codeText: string;
  mapEntries: Array<SourceMapEntry>;
};
