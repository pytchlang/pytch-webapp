import React from "react";
import { LearnerTaskCommitAddSprite } from "../../../../model/junior/jr-tutorial";
import { InlineAddSomethingButton } from "../../AddSomethingButton";

export const AddSprite: React.FC<LearnerTaskCommitAddSprite> = ({ name }) => {
  return (
    <div className="JrCommit Commit-NewSprite">
      <p>
        In the <i>Stage and Sprites</i> pane, click the{" "}
        <InlineAddSomethingButton /> button to start the process of adding a new
        sprite.
      </p>
      <p>
        In the <i>Create new sprite</i> dialog box which appears, type the name
        for your new sprite, <code>{name}</code>.
      </p>
      <p>Click the OK button.</p>
    </div>
  );
};
