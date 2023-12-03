import React, { useState } from "react";
import {
  LearnerTaskHelpStage,
  LearnerTaskHelpStageFragment,
} from "../../../model/junior/jr-tutorial";
import { Button } from "react-bootstrap";
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

type HelpStageProps = {
  stageIndex: number;
  nStagesShown: number;
  keyPath: string;
  stage: LearnerTaskHelpStage;
};
const HelpStage: React.FC<HelpStageProps> = ({
  stageIndex,
  nStagesShown,
  keyPath,
  stage,
}) => {
  if (stageIndex >= nStagesShown) {
    return null;
  }

  const content = stage.fragments.map((fragment, idx) => (
    <HelpStageFragment key={idx} fragment={fragment} />
  ));
  return (
    <>
      <div className="help-stage-divider" />
      <div key={keyPath} className="LearnerTask-HelpStage">
        {content}
      </div>
    </>
  );
};

type ShowHelpStageButtonProps = {
  nStagesStillHidden: number;
  showNextHelpStage: () => void;
  hideAllHelpStages: () => void;
};
const ShowNextHelpStageButton: React.FC<ShowHelpStageButtonProps> = ({
  nStagesStillHidden,
  showNextHelpStage,
  hideAllHelpStages,
}) => {
  const label = (() => {
    switch (nStagesStillHidden) {
      case 0:
        return "Hide help";
      case 1:
        return "Show me";
      default:
        return "Hint";
    }
  })();

  const onClick =
    nStagesStillHidden === 0 ? hideAllHelpStages : showNextHelpStage;

  return (
    <div className="ShowNextHelpStageButton-container">
      <Button
        key={nStagesStillHidden}
        variant="outline-success"
        onClick={onClick}
      >
        {label}
      </Button>
    </div>
  );
};
