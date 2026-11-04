import React from "react";
import { useTranslation } from "react-i18next";
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
import { useUiLangAttribute } from "../hooks";

const kHelpStageIdPrefix = "pytch_tut_helpstage__";
function helpStageId(fullOrPartialKeyPath: string, stageIndex?: number) {
  return stageIndex == null
    ? `${kHelpStageIdPrefix}${fullOrPartialKeyPath}`
    : `${kHelpStageIdPrefix}${fullOrPartialKeyPath}/${stageIndex}`;
}

export type TaskInteractivityKind = "old" | "previous" | "current" | "future";

type HelpStageFragmentProps = { fragment: LearnerTaskHelpStageFragment };
const HelpStageFragment: React.FC<HelpStageFragmentProps> = ({ fragment }) => {
  const { t } = useTranslation("tutorials");
  const uiLang = useUiLangAttribute();
  const content = (() => {
    switch (fragment.kind) {
      case "error":
        return (
          <div className="error-summary" lang={uiLang}>
            <p>{t("learner-task.fragment-error")}</p>
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
  const classes = classNames(
    "help-stage-content",
    isHidden ? "d-none" : "visible"
  );

  const content = stage.fragments.map((fragment, idx) => (
    // eslint-disable-next-line @eslint-react/no-array-index-key
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
  const { t } = useTranslation("tutorials");
  const content = t(`learner-task.checkbox-help.${interactivityKind}`);
  return <span>{content}</span>;
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

// Can we reduce duplication between this type and the i18n string data?
type HelpStageButtonLabelKeySuffix =
  | "label.hide"
  | "label.show-me"
  | "label.hint"
  | "description.hide"
  | "description.show-solution"
  | "description.show-first-hint"
  | "description.show-another-hint";

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
  const keyPrefix = "learner-task.help-stage-button";
  const { t: tTutorials } = useTranslation("tutorials");

  const t = (keySuffix: HelpStageButtonLabelKeySuffix) =>
    tTutorials(`${keyPrefix}.${keySuffix}`);

  if (nStagesTotal === 0) {
    return false;
  }

  const nextStageIndex = nStagesTotal - nStagesStillHidden;
  const nextStageId = helpStageId(keyPath, nextStageIndex);

  const label = (() => {
    switch (nStagesStillHidden) {
      case 0:
        return t("label.hide");
      case 1:
        return t("label.show-me");
      default:
        return t("label.hint");
    }
  })();

  const { controlsId, expanded, description, onClick } = (() => {
    if (nStagesStillHidden === 0) {
      const allHelpStageIds = range(nStagesTotal)
        .map((i) => helpStageId(keyPath, i))
        .join(" ");

      return {
        controlsId: allHelpStageIds,
        expanded: true,
        description: t("description.hide"),
        onClick: hideAllHelpStages,
      };
    } else {
      const description =
        nStagesStillHidden === 1
          ? t("description.show-solution")
          : nextStageIndex === 0
          ? t("description.show-first-hint")
          : t("description.show-another-hint");

      return {
        controlsId: nextStageId,
        expanded: false,
        description,
        onClick: showNextHelpStage,
      };
    }
  })();

  return (
    <Button
      variant="outline-success"
      className="HelpStageButton"
      onClick={onClick}
      aria-label={description}
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
  const uiLang = useUiLangAttribute();
  return (
    <div className="LearnerTaskButtonStrip" lang={uiLang}>
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
    <div
      className="LearnerTask-HelpContent"
      aria-live="polite"
      aria-atomic="true"
    >
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
    </div>
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
      data-task-index={task.index}
      data-task-kind={kind}
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
