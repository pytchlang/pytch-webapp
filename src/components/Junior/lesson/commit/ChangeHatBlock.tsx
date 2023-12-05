import React from "react";
import {
  ActorIdentifierOps,
  LearnerTaskCommitChangeHatBlock,
} from "../../../../model/junior/jr-tutorial";
import { DisplayHatBlock } from "../../HatBlock";
import { DisplayScript } from "./ScriptDiff";

// TODO: Compiler could see whether there are multiple scripts with that
// hat-block, and add a "discriminant". If there is only one script with
// that hat-block, no discriminant needed. If more than one, include as
// many initial lines as necessary to disambiguate from other scripts
// with same hat-block. Concept of "discriminantLines" might do. Can be
// empty if none needed; otherwise list of lines and then an
// "isComplete" bool, to know whether to put "..." at bottom. Or always
// include some lines to make presentation look better? More thought
// needed. Include info as to how many scripts there are with that
// hat-block-kind, to be able to say eg "there is only one of these", or
// "make sure you find the right one; there are 42 altogether".

export const ChangeHatBlock: React.FC<LearnerTaskCommitChangeHatBlock> = ({
  path,
  codeText,
  oldEvent,
  newEvent,
}) => {
  const actorNounPhrase = ActorIdentifierOps.nounPhrase(path.actor);
  const actorKind = path.actor.kind;

  return (
    <div className="JrCommit Commit-ChangeHatBlock">
      <p>Find {actorNounPhrase}, and then find this script:</p>
      <DisplayScript
        actorKind={actorKind}
        event={oldEvent}
        codeText={codeText}
      />
      <p>Double-click on the hat block and change it to:</p>
      <DisplayHatBlock
        actorKind={actorKind}
        event={newEvent}
        variant="in-editor"
      />
    </div>
  );
};
