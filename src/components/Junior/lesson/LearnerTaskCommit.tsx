import React from "react";
import { LearnerTaskCommit as LTCommit } from "../../../model/junior/jr-tutorial";
import { assertNever } from "../../../utils";
import { AddSprite } from "./commit/AddSprite";
import { AddMedialibAppearancesEntry } from "./commit/AddMedialibAppearancesEntry";
import { DeleteAppearance } from "./commit/DeleteAppearance";
import { AddScript } from "./commit/AddScript";
import { EditScript } from "./commit/EditScript";
import { ChangeHatBlock } from "./commit/ChangeHatBlock";
import { useUiLangAttribute } from "../hooks";

type LearnerTaskCommitProps = { commit: LTCommit };
export const LearnerTaskCommit: React.FC<LearnerTaskCommitProps> = ({
  commit,
}) => {
  const uiLang = useUiLangAttribute();
  const content = (() => {
    switch (commit.kind) {
      case "add-sprite":
        return <AddSprite {...commit} />;
      case "add-medialib-appearances-entry":
        return <AddMedialibAppearancesEntry {...commit} />;
      case "delete-appearance":
        return <DeleteAppearance {...commit} />;
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

  return (
    <div className="LearnerTaskCommit" lang={uiLang}>
      {content}
    </div>
  );
};
