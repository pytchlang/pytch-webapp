import React from "react";
import {
  ActorIdentifierOps,
  LearnerTaskCommitAddMedialibAppearance,
} from "../../../../model/junior/jr-tutorial";
import { ActorKindOps } from "../../../../model/junior/structured-program";
import { InlineAddSomethingButton } from "../../AddSomethingButton";

// TODO: Include thumbnail of required costume?

export const AddMedialibAppearance: React.FC<
  LearnerTaskCommitAddMedialibAppearance
> = ({ actor, displayIdentifier }) => {
  const actorKindNames = ActorKindOps.names(actor.kind);
  const actorNounPhrase = ActorIdentifierOps.nounPhrase(actor);

  return (
    <div className="JrCommit Commit-AddMedialibCostume">
      <p>
        In the <i>Stage and Sprites</i> pane, select {actorNounPhrase}.
      </p>
      <p>
        In the coding pane, select the {actorKindNames.appearancesDisplayTitle}{" "}
        tab.
      </p>
      <p>
        Click the <InlineAddSomethingButton label="Add from media library" />{" "}
        button.
      </p>
      <p>
        Find the <code>{displayIdentifier}</code>{" "}
        {actorKindNames.appearanceDisplay}, and click the “Add 1 to project”
        button.
      </p>
    </div>
  );
};
