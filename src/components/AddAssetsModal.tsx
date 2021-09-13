import React from "react";
import Modal from "react-bootstrap/Modal";
import { useStoreActions, useStoreState } from "../store";
import { Failure } from "../model/user-interactions/add-assets";
import { assertNever } from "../utils";
import { ChooseFiles } from "./ChooseFiles";

const AdditionFailures: React.FC<{ failures: Array<Failure> }> = (props) => {
  const dismiss = useStoreActions(
    (actions) => actions.userConfirmations.addAssetsInteraction.dismiss
  );

  const failureEntries = props.failures.map((failure) => (
    <li key={failure.fileName}>
      <code>{failure.fileName}</code> — {failure.reason}
    </li>
  ));

  return (
    <Modal show={true} animation={false} className="add-asset-failures">
      <Modal.Header closeButton={true} onHide={() => dismiss()}>
        <Modal.Title>Problem adding images or sounds</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Sorry, there was a problem adding files to your project:</p>
        <ul>{failureEntries}</ul>
        <p>Please check the files and try again.</p>
      </Modal.Body>
    </Modal>
  );
};

export const AddAssetsModal = () => {
  const state = useStoreState(
    (state) => state.userConfirmations.addAssetsInteraction
  );
  const { tryAdd, dismiss } = useStoreActions(
    (actions) => actions.userConfirmations.addAssetsInteraction
  );

  switch (state.status) {
    case "idle":
      return null;
    case "awaiting-user-choice":
    case "trying-to-add":
      return (
        <ChooseFiles
          titleText="Add images or sounds"
          introText="Choose image or sound files to add to your project."
          actionButtonText="Add to project"
          status={state.status}
          tryProcess={(files) => tryAdd(files)}
          dismiss={() => dismiss()}
        />
      );
    case "showing-failures":
      return <AdditionFailures failures={state.failures} />;
    default:
      assertNever(state);
      return null;
  }
};
