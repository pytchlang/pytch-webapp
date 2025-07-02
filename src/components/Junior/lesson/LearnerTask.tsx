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
import { assertNever, range } from "../../../utils";
import { LearnerTaskCommit } from "./LearnerTaskCommit";
import { RawOrCodeSnippet, withCodeSnippetsRendered } from "./RawOrCodeSnippet";
import { useStoreActions } from "../../../store";
import { useMappedLinkedJrTutorial } from "./hooks";

const kHelpStageIdPrefix = "pytch_tut_helpstage__";
function helpStageId(fullOrPartialKeyPath: string, stageIndex?: number) {
  return stageIndex == null
    ? `${kHelpStageIdPrefix}${fullOrPartialKeyPath}`
    : `${kHelpStageIdPrefix}${fullOrPartialKeyPath}/${stageIndex}`;
}

export type TaskInteractivityKind = "old" | "previous" | "current" | "future";

type HelpStageFragmentProps = { fragment: LearnerTaskHelpStageFragment };
const HelpStageFragment: React.FC<HelpStageFragmentProps> = ({ fragment }) => {
  const content = (() => {
    switch (fragment.kind) {
      case "error":
        return (
          <div className="error-summary">
            <p>
              Tutorial error. Please contact the Pytch team if you see this!
              (Unless you are the author of a tutorial and you understand the
              message below.)
            </p>
            <pre className="error-message">{fragment.message}</pre>
            <div className="original-node">
              <RawElement element={fragment.element} />
            </div>
          </div>
        );
      case "element": {
        const element = fragment.element;
        return element instanceof Text ? null : (
          <RawOrCodeSnippet element={element} />
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
  const isHidden = stageIndex >= nStagesShown;
  const classes = classNames(isHidden && "d-none");

  const content = stage.fragments.map((fragment, idx) => (
    <HelpStageFragment key={idx} fragment={fragment} />
  ));
  return (
    <div className={classes} id={helpStageId(keyPath)}>
      <div className="help-stage-divider" />
      <div className="LearnerTask-HelpStage">{content}</div>
    </div>
  );
};

type CheckboxHelpProps = { interactivityKind: TaskInteractivityKind };
const CheckboxHelp: React.FC<CheckboxHelpProps> = ({ interactivityKind }) => {
  switch (interactivityKind) {
    case "current":
      return <span>Click when you’ve done this.</span>;
    case "previous":
      return <span>Done! (Click to rewind to this task.)</span>;
    case "old":
      return <span>Done!</span>;
    case "future":
      return <span>(This is a task preview)</span>;
    default:
      return assertNever(interactivityKind);
  }
};

type TaskCheckboxButtonProps = {
  interactivityKind: TaskInteractivityKind;
  onCheckboxClick: () => void;
};
const TaskCheckboxButton: React.FC<TaskCheckboxButtonProps> = ({
  interactivityKind,
  onCheckboxClick,
}) => {
  const isDisabled =
    interactivityKind === "old" || interactivityKind === "future";
  const isPressed =
    interactivityKind === "old" || interactivityKind === "previous";
  return (
    <Button
      variant="outline-secondary"
      aria-pressed={isPressed}
      disabled={isDisabled}
      className="TaskCheckboxButton"
      onClick={onCheckboxClick}
    >
      <FontAwesomeIcon className="to-do-checkbox" icon="check-square" />
      <CheckboxHelp interactivityKind={interactivityKind} />
    </Button>
  );
};

type HelpStageButtonProps = {
  keyPath: string;
  nStagesTotal: number;
  nStagesStillHidden: number;
  hideAllHelpStages: () => void;
  showNextHelpStage: () => void;
};
const HelpStageButton: React.FC<HelpStageButtonProps> = ({
  keyPath,
  nStagesTotal,
  nStagesStillHidden,
  hideAllHelpStages,
  showNextHelpStage,
}) => {
  if (nStagesTotal === 0) {
    return false;
  }

  const nextStageIndex = nStagesTotal - nStagesStillHidden;
  const nextStageId = helpStageId(keyPath, nextStageIndex);

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

  const { controlsId, expanded } = (() => {
    if (nStagesStillHidden === 0) {
      const allHelpStageIds = range(nStagesTotal)
        .map((i) => helpStageId(keyPath, i))
        .join(" ");
      return {
        controlsId: allHelpStageIds,
        expanded: true,
      };
    } else {
      return {
        controlsId: nextStageId,
        expanded: false,
      };
    }
  })();

  return (
    <Button
      variant="outline-success"
      onClick={onClick}
      aria-controls={controlsId}
      aria-expanded={expanded}
    >
      {label}
    </Button>
  );
};

type LearnerTaskButtonStripProps = {
  keyPath: string;
  nStagesTotal: number;
  nStagesStillHidden: number;
  interactivityKind: TaskInteractivityKind;
  showNextHelpStage: () => void;
  hideAllHelpStages: () => void;
  onCheckboxClick: () => void;
};
const LearnerTaskButtonStrip: React.FC<LearnerTaskButtonStripProps> = ({
  keyPath,
  nStagesTotal,
  nStagesStillHidden,
  interactivityKind,
  showNextHelpStage,
  hideAllHelpStages,
  onCheckboxClick,
}) => {
  return (
    <div className="LearnerTaskButtonStrip">
      <TaskCheckboxButton
        interactivityKind={interactivityKind}
        onCheckboxClick={onCheckboxClick}
      />
      <HelpStageButton
        {...{
          keyPath,
          nStagesTotal,
          nStagesStillHidden,
          hideAllHelpStages,
          showNextHelpStage,
        }}
      />
    </div>
  );
};

type LearnerTaskProps = {
  keyPath: string;
  task: LearnerTaskDescriptor;
  kind: TaskInteractivityKind;
};
export const LearnerTask: React.FC<LearnerTaskProps> = ({
  keyPath,
  task,
  kind,
}) => {
  const nHelpStagesShown = useMappedLinkedJrTutorial(
    (tutorial) =>
      tutorial.interactionState.taskStates[task.index].nHelpStagesShown
  );
  const showNextHelpStage = useStoreActions(
    (actions) => actions.activeProject.showNextHelpStage
  );
  const hideAllHelpStages = useStoreActions(
    (actions) => actions.activeProject.hideAllHelpStages
  );
  const markCurrentTaskDone = useStoreActions(
    (actions) => actions.activeProject.markCurrentTaskDone
  );
  const markPreviousTaskNotDone = useStoreActions(
    (actions) => actions.activeProject.markPreviousTaskNotDone
  );

  const onCheckboxClick = () => {
    switch (kind) {
      case "old":
      case "future":
        // Ignore.
        break;
      case "previous":
        markPreviousTaskNotDone();
        break;
      case "current":
        markCurrentTaskDone();
        break;
      default:
        assertNever(kind);
    }
  };

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
  const helpContent = (
    <>
      {taskHelpStages}
      <div className="help-stage-divider" />
      <LearnerTaskButtonStrip
        keyPath={keyPath}
        nStagesTotal={task.helpStages.length}
        nStagesStillHidden={nStagesStillHidden}
        interactivityKind={kind}
        showNextHelpStage={() => showNextHelpStage(task.index)}
        hideAllHelpStages={() => hideAllHelpStages(task.index)}
        onCheckboxClick={onCheckboxClick}
      />
    </>
  );

  const alertVariant = kind === "current" ? "success" : "light";
  const classes = classNames("LearnerTask", `learner-task-${kind}`);

  // Suppress the usual Bootstrap Alert transition.  We manage this
  // ourselves, to fade between the "done" and "not done" states of a
  // LearnerTask as the user marks a task as done.
  return (
    <Alert
      transition={false}
      key={keyPath}
      variant={alertVariant}
      className={classes}
    >
      <div className="task-outline">
        <div className="task-intro-content">
          <RawElement element={withCodeSnippetsRendered(task.intro)} />
        </div>
      </div>
      {helpContent}
    </Alert>
  );
};
