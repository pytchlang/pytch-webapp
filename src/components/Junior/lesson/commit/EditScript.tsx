import React from "react";
import {
  ActorIdentifierOps,
  LearnerTaskCommitEditScript,
} from "../../../../model/junior/jr-tutorial";
import { ScriptDiff } from "./ScriptDiff";

export const EditScript: React.FC<LearnerTaskCommitEditScript> = ({
  path,
  event,
  newCodeText,
  oldCodeText,
}) => {
  const actorNounPhrase = ActorIdentifierOps.nounPhrase(path.actor);
  const actorKind = path.actor.kind;

  return (
    <div className="JrCommit Commit-AddScriptBody">
      <p>
        In the Stage and Sprites pane, select {actorNounPhrase}. In the coding
        pane, select the Code tab, and find this script:
      </p>
      <ScriptDiff {...{ actorKind, event, oldCodeText, newCodeText }} />
      <p>
        Use the three tabs under the code to see what change you need to make to
        your code.
      </p>
    </div>
  );
};
