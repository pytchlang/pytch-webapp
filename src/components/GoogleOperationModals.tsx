import { Button, Modal, Spinner } from "react-bootstrap";
import { useStoreState, useStoreActions } from "../store";
import React, { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { assertNever, EmptyProps } from "../utils";
import { GoogleUserInfo } from "../storage/google-drive/shared";
import {
  SuccessfulOperation,
  TaskOutcome,
  TransferKind,
} from "../model/google-drive-import-export";
import { FileProcessingFailure } from "../model/user-interactions/process-files";
import { CompoundTextInput } from "./CompoundTextInput";
import { useActionAsEffect } from "./hooks/use-action-as-effect";
import { useResolveStringSpec } from "./hooks/resolve-string-spec";
import { resolveRawOrI18n } from "../model/i18n/utils";
import { ErrorMessageDisplay } from "./ErrorMessageDisplay";
import { mkRawSpec } from "../model/i18n/core-types";

export const GoogleGetFilenameFromUserModal = () => {
  const { t } = useTranslation("projects");
  const { t: tCommon } = useTranslation("common");
  const state = useStoreState(
    (state) => state.googleDriveImportExport.chooseFilenameFlow.state
  );
  const { setUserInput, clearJustLaunched, submit, cancel } = useStoreActions(
    (actions) => actions.googleDriveImportExport.chooseFilenameFlow
  );

  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    // This doesn't work when running the development server in
    // live-reload mode.  The input element is not focused.  It works OK
    // when running the development server with
    //
    //     DEV_VITE_USE_PREVIEW=yes
    //
    // (but then you lose live-reload).  It also works in production
    // builds.  Might be to do with the React "render things twice in
    // dev.mode" coupled with the Google authentication pop-up window,
    // but I did not get to the bottom of it.
    const element = inputRef.current;
    if (element != null && state.kind === "active" && state.justLaunched) {
      element.focus();
      element.setSelectionRange(0, element.value.length, "forward");
      clearJustLaunched();
    }
  });

  if (state.kind === "idle") {
    return null;
  }

  const userInput = state.userInput;
  const filenameIsValid = userInput !== "";

  const doSubmit = () => submit();
  const doCancel = () => cancel();

  const onEnterKey = () => {
    if (filenameIsValid) {
      doSubmit();
    }
  };

  return (
    <Modal
      className="GoogleGetFilenameFromUserModal"
      show={true}
      onHide={cancel}
      animation={false}
      centered
    >
      <Modal.Header>
        <Modal.Title>{t("google-export.get-filename.title")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{t("google-export.get-filename.prompt")}</p>
        <CompoundTextInput
          formatSpecifier={state.formatSpecifier}
          onNewUiFragmentValue={setUserInput}
          onEnterKey={onEnterKey}
          ref={inputRef}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={doCancel}>
          {tCommon("button.cancel")}
        </Button>
        <Button
          disabled={!filenameIsValid}
          variant="primary"
          onClick={doSubmit}
        >
          {t("google-export.get-filename.button.export")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const GooglePendingModalBody: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("common");
  return (
    <Modal.Body className="pending">
      <div aria-label={t("working.title")} role="status">
        <Spinner aria-hidden="true" animation="border" />
      </div>
    </Modal.Body>
  );
};

export const GoogleAuthenticationStatusModal = () => {
  const { t } = useTranslation("projects");
  const { t: tCommon } = useTranslation("common");
  const authState = useStoreState(
    (state) => state.googleDriveImportExport.authState
  );

  useActionAsEffect((actions) => actions.googleDriveImportExport.maybeBoot);

  switch (authState.kind) {
    case "succeeded":
    case "idle":
      return null;
    case "pending": {
      const cancelAuth = () => {
        // TODO: Should we abort with a string or an Error built from
        // that string?
        authState.abortController.abort("user cancelled authentication");
      };

      return (
        <Modal
          className="GoogleAuthenticationStatusModal"
          show={true}
          animation={false}
          centered
        >
          <Modal.Header>
            <Modal.Title>{t("google-auth.connecting.title")}</Modal.Title>
          </Modal.Header>
          <GooglePendingModalBody />
          <Modal.Footer>
            <Button variant="secondary" onClick={cancelAuth}>
              {tCommon("button.cancel")}
            </Button>
          </Modal.Footer>
        </Modal>
      );
    }
    default:
      return assertNever(authState);
  }
};

type GoogleUserInfoSubHeaderProps = {
  user: GoogleUserInfo;
};

const GoogleUserInfoSubHeader: React.FC<GoogleUserInfoSubHeaderProps> = ({
  user,
}) => {
  const resolveStringSpec = useResolveStringSpec();

  const userName = resolveStringSpec(user.displayName);
  const userEmail = resolveStringSpec(user.emailAddress);

  return (
    <Modal.Header className="user-info">
      <p>{userName}</p>
      <p>
        <code>{userEmail}</code>
      </p>
    </Modal.Header>
  );
};

type OutcomesOfKindListProps = {
  outcomesKind: "successes" | "failures";
  items: Array<string>;
};
const OutcomesOfKindList: React.FC<OutcomesOfKindListProps> = ({
  outcomesKind,
  items,
}) => {
  return (
    <div className={`outcome-summary ${outcomesKind}`}>
      <p>
        <Trans
          i18nKey={`google-export.outcome.${outcomesKind}`}
          ns="projects"
          count={items.length}
        />
      </p>
      <ul>
        {items.map((item, idx) => (
          // eslint-disable-next-line @eslint-react/no-array-index-key
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

type OutcomeSuccessesProps = {
  operations: Array<SuccessfulOperation>;
};
const OutcomeSuccesses: React.FC<OutcomeSuccessesProps> = ({ operations }) => {
  const { t } = useTranslation("projects");
  const nOperations = operations.length;
  if (nOperations === 0) {
    return null;
  }

  const items = operations.map((op) =>
    t(`google-${op.kind}.success`, { replace: { filename: op.filename } })
  );

  return <OutcomesOfKindList outcomesKind="successes" items={items} />;
};

type OutcomeFailuresProps = {
  failures: Array<FileProcessingFailure>;
};

const OutcomeFailures: React.FC<OutcomeFailuresProps> = ({ failures }) => {
  const { i18n } = useTranslation();
  const { t } = useTranslation("projects");

  const nFailures = failures.length;
  if (nFailures === 0) {
    return null;
  }

  const items = failures.map((f) => {
    const reason = resolveRawOrI18n(i18n, f.reason);
    return t("google-import.failure", {
      replace: { filename: f.filename, reason },
    });
  });

  return <OutcomesOfKindList outcomesKind="failures" items={items} />;
};

type TaskOutcomeBodyProps = {
  outcome: TaskOutcome;
};

const TaskOutcomeBody: React.FC<TaskOutcomeBodyProps> = ({ outcome }) => {
  const { t } = useTranslation("projects");

  switch (outcome.kind) {
    case "cancelled":
      return (
        <p className="cancelled-message">
          {t("google-operation.outcome.cancelled")}
        </p>
      );
    case "no-files-selected":
      return (
        <p className="no-files-message">
          {t("google-operation.outcome.no-files-selected")}
        </p>
      );
    case "error":
      return <ErrorMessageDisplay errorSpec={mkRawSpec(outcome.message)} />;
    case "completed":
      return (
        <>
          <OutcomeSuccesses operations={outcome.successes} />
          <OutcomeFailures failures={outcome.failures} />
        </>
      );
    default:
      return assertNever(outcome);
  }
};

type GoogleTaskStatusModalHeaderProps = {
  transferKind: TransferKind;
};
const GoogleTaskStatusModalHeader: React.FC<
  GoogleTaskStatusModalHeaderProps
> = ({ transferKind }) => {
  const { t } = useTranslation("projects");
  const i18nKey = `google-${transferKind}.status-title` as const;
  return (
    <Modal.Header>
      <Modal.Title>{t(i18nKey)}</Modal.Title>
    </Modal.Header>
  );
};

export const GoogleTaskStatusModal = () => {
  const { t: tCommon } = useTranslation("common");
  const taskState = useStoreState(
    (state) => state.googleDriveImportExport.taskState
  );

  switch (taskState.kind) {
    case "idle":
      return null;
    case "pending-already-modal":
      // Return something invisible for e2e test support.
      return (
        <div
          className="GoogleTaskStatusModal-already-modal"
          style={{ display: "none" }}
        />
      );
    case "pending": {
      return (
        <Modal
          className="GoogleTaskStatusModal"
          show={true}
          animation={false}
          centered
        >
          <GoogleTaskStatusModalHeader transferKind={taskState.transferKind} />
          <GoogleUserInfoSubHeader user={taskState.user} />
          <GooglePendingModalBody />
        </Modal>
      );
    }
    case "done": {
      const dismiss = taskState.dismissNotification;
      return (
        <Modal
          className="GoogleTaskStatusModal"
          show={true}
          animation={false}
          centered
        >
          <GoogleTaskStatusModalHeader transferKind={taskState.transferKind} />
          <GoogleUserInfoSubHeader user={taskState.user} />
          <Modal.Body>
            <TaskOutcomeBody outcome={taskState.outcome} />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={dismiss}>
              {tCommon("button.ok")}
            </Button>
          </Modal.Footer>
        </Modal>
      );
    }
    default:
      return assertNever(taskState);
  }
};
