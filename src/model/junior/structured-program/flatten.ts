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

const gensym = (() => {
  let nextId = 90001;
  return () => `f${nextId++}`;
})();

const pushActorLines = (
  lines: Array<string>,
  mapEntries: Array<SourceMapEntry>,
  actor: Actor,
  allAssets: Array<AssetMetaData>
): void => {
  const kindNames = ActorKindOps.names(actor.kind);

  lines.push(`class ${actor.name}(pytch.${kindNames.subclass}):`);

  const actorAssets = AssetMetaDataOps.filterByActor(allAssets, actor.id);

  lines.push(`    ${kindNames.appearancesAttribute} = [`);
  actorAssets.appearances.forEach((a) => {
    lines.push(`        ("${a.basename}", "${a.fullPathname}"),`);
  });
  lines.push("    ]");

  lines.push("    Sounds = [");
  actorAssets.sounds.forEach((s) => {
    lines.push(`        ("${s.basename}", "${s.fullPathname}"),`);
  });
  lines.push("    ]");

  actor.handlers.forEach((h) => {
    lines.push(`    ${EventDescriptorOps.decorator(h.event)}`);
    lines.push(`    def ${gensym()}(self):`);

    // TODO: Avoid a method whose body is just "pass" by checking for
    // all-whitespace pythonCode?
    lines.push(`        pass`);

    // The next line will be the first line of the user's code.
    mapEntries.push({
      actorId: actor.id,
      handlerId: h.id,
      startLine: lines.length,
    });

    const pythonLines = h.pythonCode.split("\n");
    pythonLines.forEach((x) => {
      lines.push(`        ${x}`);
    });
  });
};

/** Convert the given structured `program` (which uses the given
 * `assets`) into a flat Python program (and also a map recording the
 * actor/handler origin of the method bodies of the resulting flat
 * code). */
export const flattenProgram = (
  program: StructuredProgram,
  assets: Array<AssetMetaData>
): FlattenResults => {
  // TODO: What's the right way to handle "extensions"?  As another
  // property of a StructuredProgram?
  let lines = ["import pytch", "import random", "import math"];

  let mapEntries: Array<SourceMapEntry> = [];

  program.actors.forEach((a) => pushActorLines(lines, mapEntries, a, assets));
  const codeText = lines.join("\n");

  return { codeText, mapEntries };
};
