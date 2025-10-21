/* eslint-disable @typescript-eslint/no-explicit-any */

// Very rudimentary auto-completion
//
// Only complete "pytch." and "self.", with hard-coded list of options
// based on the public module functions and base-class methods.

import { IAceEditor } from "react-ace/lib/types";
import { assertNever } from "../utils";
import { DevWorkContext } from "../model/dev-work-context";
import { Ace } from "ace-builds/ace";

declare let Sk: any;

// Think it's a bug in Ace's typing that the "message" slot is missing.
type IAceCompletion = Ace.ValueCompletion & { message: string };

const completionFromPyTuple =
  (meta: string | null) =>
  (tup: any): IAceCompletion => ({
    caption: tup.v[0].v + tup.v[1].v,
    value: tup.v[0].v,
    meta: meta ?? undefined,
    message: tup.v[3].v,
  });

const withoutMeta = (completion: IAceCompletion): IAceCompletion => ({
  caption: completion.caption,
  value: completion.value,
  message: completion.message,
});

const kPytchPerMethodExclusions = [
  "Sprite",
  "Stage",
  "when_green_flag_clicked",
  "when_I_receive",
  "when_I_start_as_a_clone",
  "when_key_pressed",
  "when_stage_clicked",
  "when_this_sprite_clicked",
];

const withoutPerMethodExclusions = (
  completions: Array<IAceCompletion>
): Array<IAceCompletion> => {
  // Assert that all exclusions are in the original input array, to try
  // to catch typos.
  const completionValues = completions.map((c) => c.value);
  const missingExclusions = kPytchPerMethodExclusions.filter(
    (value) => !completionValues.includes(value)
  );
  if (missingExclusions.length > 0) {
    throw new Error(
      "some exclusions not found in full completions list: " +
        JSON.stringify(missingExclusions)
    );
  }

  return completions.filter(
    (completion) => !kPytchPerMethodExclusions.includes(completion.value)
  );
};

const completionsFromPyList = (meta: string | null, lst: any) =>
  lst.v.map(completionFromPyTuple(meta));

// Invoke the Python function _user_facing_completions() and
// use the provided info on the user-facing attributes of pytch,
// Actor, Sprite, and Stage.
//
const kCompletions = (() => {
  Sk.configure({});
  const pyStr = (s: string) => new Sk.builtin.str(s);
  const sUserFacingCompletions = pyStr("_user_facing_completions");
  const sPytch = pyStr("pytch");
  const sActor = pyStr("Actor");
  const sSprite = pyStr("Sprite");
  const sStage = pyStr("Stage");

  const pyMod = Sk.builtin.__import__("pytch", {}, {}, [], -1);
  const pyCompletionsInfoFun = Sk.builtin.getattr(
    pyMod,
    sUserFacingCompletions
  );
  const pyCompletionsInfo = pyCompletionsInfoFun.tp$call([], {});

  // Return value is (completions, attrsWithoutDocs); ignore the latter.
  const pyCompletionsByKind = pyCompletionsInfo.v[0];

  // Set top-level var holding completions for "pytch.":
  //
  const allPytch = completionsFromPyList(
    null,
    pyCompletionsByKind.mp$subscript(sPytch)
  );

  // Set top-level var holding completions for "self.":
  //
  const actorCompletions = completionsFromPyList(
    "[Spr/Stg]",
    pyCompletionsByKind.mp$subscript(sActor)
  );
  const spriteCompletions = completionsFromPyList(
    "[Spr]",
    pyCompletionsByKind.mp$subscript(sSprite)
  );
  const stageCompletions = completionsFromPyList(
    "[Stg]",
    pyCompletionsByKind.mp$subscript(sStage)
  );
  const actor = [
    ...actorCompletions,
    ...spriteCompletions,
    ...stageCompletions,
  ];

  const sprite = actorCompletions.concat(spriteCompletions).map(withoutMeta);
  const stage = actorCompletions.concat(stageCompletions).map(withoutMeta);

  return {
    allPytch,
    perMethodPytch: withoutPerMethodExclusions(allPytch),
    actor,
    sprite,
    stage,
  };
})();

export class PytchAceAutoCompleter {
  readonly context: DevWorkContext;

  constructor(context: DevWorkContext) {
    this.context = context;
  }

  // TODO: Proper types for the remaining arguments.
  getCompletions(
    _editor: IAceEditor,
    session: any,
    pos: any,
    prefix: string,
    callback: any
  ) {
    const cursorLine = session.getLine(pos.row);
    const lineHead = cursorLine.substring(0, pos.column);

    if (!lineHead.endsWith(prefix)) {
      // TODO: What's the right way to report this error to Ace?
      callback(null, []);
    }

    const prePrefixLength = lineHead.length - prefix.length;
    const prePrefix = lineHead.substring(0, prePrefixLength);
    const programKind = this.context.programKind;

    const candidates = (() => {
      if (prePrefix.endsWith("pytch.")) {
        switch (programKind) {
          case "flat":
            return kCompletions.allPytch;
          case "per-method":
            return kCompletions.perMethodPytch;
          default:
            return assertNever(this.context);
        }
      } else if (prePrefix.endsWith("self.")) {
        switch (programKind) {
          case "flat":
            return kCompletions.actor;
          case "per-method":
            switch (this.context.actorKind) {
              case "sprite":
                return kCompletions.sprite;
              case "stage":
                return kCompletions.stage;
              default:
                return assertNever(this.context.actorKind);
            }
          default:
            return assertNever(this.context);
        }
      } else {
        return [];
      }
    })();

    callback(null, candidates);
  }
}
