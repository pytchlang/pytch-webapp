import { Button, Modal, Spinner } from "react-bootstrap";
import { useStoreState, useStoreActions } from "../store";
import { useEffect } from "react";
import { assertNever } from "../utils";

export const GoogleAuthenticationStatusModal = () => {
  const authState = useStoreState(
    (state) => state.googleDriveImportExport.authState
  );
  const maybeBoot = useStoreActions(
    (actions) => actions.googleDriveImportExport.maybeBoot
  );

  useEffect(() => {
    maybeBoot();
  });

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
            <Modal.Title>Connecting to Google account</Modal.Title>
          </Modal.Header>
          <Modal.Body className="pending">
            <Spinner animation="border" />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={cancelAuth}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      );
    }
    default:
      return assertNever(authState);
  }
};
