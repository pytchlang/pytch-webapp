import React, { useState } from "react";
import {
  LearnerTaskHelpStageFragment,
} from "../../../model/junior/jr-tutorial";
import { assertNever } from "../../../utils";
import { LearnerTaskCommit } from "./LearnerTaskCommit";
import { RawOrScratchBlock } from "./RawOrScratchBlock";

type HelpStageFragmentProps = { fragment: LearnerTaskHelpStageFragment };
const HelpStageFragment: React.FC<HelpStageFragmentProps> = ({ fragment }) => {
  const content = (() => {
    switch (fragment.kind) {
      case "element": {
        const element = fragment.element;
        return element instanceof Text ? null : (
          <RawOrScratchBlock element={element} />
        );
      }
      case "commit":
        return <LearnerTaskCommit commit={fragment.commit} />;
      default:
        return assertNever(fragment);
    }
  })();

  return content == null ? null : (
    <div className="HelpStageFragment">{content}</div>
  );
};
