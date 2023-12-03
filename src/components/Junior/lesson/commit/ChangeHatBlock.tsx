import React from "react";
import {
  ActorIdentifierOps,
  LearnerTaskCommitChangeHatBlock,
} from "../../../../model/junior/jr-tutorial";
import { DisplayHatBlock } from "../../HatBlock";
import { DisplayScript } from "./ScriptDiff";

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
