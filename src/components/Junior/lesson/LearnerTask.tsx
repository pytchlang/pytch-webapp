import React from "react";
import {
  LearnerTask as LearnerTaskDescriptor,
  LearnerTaskHelpStage,
  LearnerTaskHelpStageFragment,
} from "../../../model/junior/jr-tutorial";
import { Alert, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import RawElement from "../../RawElement";
import classNames from "classnames";
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

type LearnerTaskProps = {
  keyPath: string;
  task: LearnerTaskDescriptor;
  kind: "old" | "previous" | "current";
};
export const LearnerTask: React.FC<LearnerTaskProps> = ({
  keyPath,
  task,
  kind,
}) => {


  // TODO: Avoid computing all this if task is done.
  const taskHelpStages = task.helpStages.map((stage, idx) => {
    const innerKeyPath = `${keyPath}/${idx}`;
    return (
      <HelpStage
        key={innerKeyPath}
        keyPath={innerKeyPath}
        stageIndex={idx}
        nStagesShown={nHelpStagesShown}
        stage={stage}
      />
    );
  });

  const nStagesStillHidden = task.helpStages.length - nHelpStagesShown;
  const maybeHelpContent = taskIsDone ? null : (
    <>
      {taskHelpStages}
      <div className="help-stage-divider" />
      <ShowNextHelpStageButton
        {...{ nStagesStillHidden, showNextHelpStage, hideAllHelpStages }}
      />
    </>
  );

  const classes = classNames("LearnerTask", { taskIsDone });
  return (
    <Alert key={keyPath} variant="success" className={classes}>
      <div className="task-outline">
        <FontAwesomeIcon
          className="to-do-checkbox"
          icon="check-square"
          onClick={toggleDone}
        />
        <div className="task-intro-content">
          <RawElement element={task.intro} />
        </div>
      </div>
      {maybeHelpContent}
    </Alert>
  );
};
