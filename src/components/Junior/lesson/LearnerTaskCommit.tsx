import React from "react";
import { LearnerTaskCommit as LTCommit } from "../../../model/junior/jr-tutorial";
import { assertNever } from "../../../utils";
import { AddSprite } from "./commit/AddSprite";
import { AddMedialibAppearance } from "./commit/AddMedialibCostume";
import { AddScript } from "./commit/AddScript";
import { EditScript } from "./commit/EditScript";
import { ChangeHatBlock } from "./commit/ChangeHatBlock";

type LearnerTaskCommitProps = { commit: LTCommit };
export const LearnerTaskCommit: React.FC<LearnerTaskCommitProps> = ({
  commit,
}) => {
  const content = (() => {
    switch (commit.kind) {
      case "add-sprite":
        return <AddSprite {...commit} />;
      case "add-medialib-appearance":
        return <AddMedialibAppearance {...commit} />;
      case "add-script":
        return <AddScript {...commit} />;
      case "edit-script":
        return <EditScript {...commit} />;
      case "change-hat-block":
        return <ChangeHatBlock {...commit} />;
      default:
        return assertNever(commit);
    }
  })();

  return <div className="LearnerTaskCommit">{content}</div>;
};
