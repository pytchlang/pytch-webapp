import React from "react";
import {
  ActorIdentifierOps,
  LearnerTaskCommitAddScript,
} from "../../../../model/junior/jr-tutorial";
import { DisplayHatBlock } from "../../HatBlock";
import { InlineAddSomethingButton } from "../../AddSomethingButton";
import { DisplayScript } from "./ScriptDiff";
import { EventDescriptorKindOps } from "../../../../model/junior/structured-program";

export const AddScript: React.FC<LearnerTaskCommitAddScript> = ({
  path,
  event,
  codeText,
}) => {
  const actorNounPhrase = ActorIdentifierOps.nounPhrase(path.actor);
  const actorKind = path.actor.kind;

  const maybeParamName = EventDescriptorKindOps.maybeArgumentName(event.kind);
  const maybeProvideArgumentContent = maybeParamName && (
    <>
      <p>Fill in the right {maybeParamName}:</p>
      <DisplayHatBlock
        actorKind={actorKind}
        event={event}
        variant="fully-specified"
      />
    </>
  );

  const maybeAddCodeContent = codeText !== "" && (
    <>
      <p>
        Find your new empty script in the Code panel, and type in this code:
      </p>
      <DisplayScript {...{ actorKind, event, codeText }} />
    </>
  );

  return (
    <div className="JrCommit Commit-AddScript">
      <p>
        In the Stage and Sprites pane, select {actorNounPhrase}. In the coding
        pane, select the Code tab, and use the{" "}
        <InlineAddSomethingButton label="Add script" /> button to
        start the process of adding a script.
      </p>

      <p>Choose this hat-block:</p>

      <DisplayHatBlock
        actorKind={path.actor.kind}
        event={event}
        variant="kind-chosen"
      />

      {maybeProvideArgumentContent}

      <p>Click the OK button to add an empty script with this hat-block.</p>

      {maybeAddCodeContent}
    </div>
  );
};
