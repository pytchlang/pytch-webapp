import React, { useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import { Button } from "react-bootstrap";
import { useStoreState, useStoreActions } from "../store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ClipArtGalleryState } from "../model/clipart-gallery";
import { assertNever } from "../utils";
import { MaybeErrorOrSuccessReport } from "./MaybeErrorOrSuccessReport";

const bodyContent = (
  gallery: ClipArtGalleryState,
  selectedIds: Array<number>,
  selectItemById: (id: number) => void,
  deselectItemById: (id: number) => void
) => {
  switch (gallery.status) {
    case "fetch-failed":
      return <p>Oops, sorry</p>;
    case "fetch-not-started":
    case "fetch-pending":
      return <p>loading...</p>;
    case "ready":
      return (
        <div className="clipart-gallery">
          <ul>
            {gallery.items.map((item: any) => {
              const isSelected =
                selectedIds.findIndex((id) => id === item.id) !== -1;
              const extraClass = isSelected ? " selected" : "";
              const clickHandler = isSelected
                ? deselectItemById
                : selectItemById;
              return (
                <li>
                  <div
                    className="clipart-card"
                    onClick={() => clickHandler(item.id)}
                  >
                    <p className="clipart-checkmark">
                      <span className={`clipart-selection${extraClass}`}>
                        <FontAwesomeIcon
                          className="fa-lg"
                          icon="check-circle"
                        />
                      </span>
                    </p>
                    <p className="clipart-name">{item.name}</p>
                    <p className="clipart-thumbnail">
                      <img style={{ width: 100 }} src={item.url} />
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      );
  }
};

export const AddClipartModal = () => {
  const { attempt, dismiss } = useStoreActions(
    (actions) => actions.userConfirmations.addClipArtItemsInteraction
  );
  const { isActive, attemptSucceeded, maybeLastFailureMessage } = useStoreState(
    (state) => state.userConfirmations.addClipArtItemsInteraction
  );
  const gallery = useStoreState((state) => state.clipArtGallery.state);
  const startFetchIfRequired = useStoreActions(
    (actions) => actions.clipArtGallery.startFetchIfRequired
  );
  const selectedIds = useStoreState((state) => state.selectClipArt.selectedIds);
  const selectItemById = useStoreActions(
    (actions) => actions.selectClipArt.selectItemById
  );
  const deselectItemById = useStoreActions(
    (actions) => actions.selectClipArt.deselectItemById
  );
  const noneSelected = selectedIds.length === 0;

  const activeProject = useStoreState((state) => state.activeProject.project);

  useEffect(() => {
    startFetchIfRequired();
  });

  const projectId = activeProject.id;

  const maybeAttempt = () => {
    switch (gallery.status) {
      case "fetch-failed":
      case "fetch-not-started":
      case "fetch-pending":
        // This function should never be called unless the
        // gallery is in state "ready", because the button
        // should only be enabled if some items have been
        // selected, and that in turn is only possible once
        // we have the items.
        console.warn(`unexpected gallery state ${gallery.status}`);
        break;
      case "ready":
        // For this sketch I'm just passing the gallery items
        // but for the real thing you need the whole descriptor.
        const galleryItems = gallery.items;
        attempt({ selectedIds, galleryItems, projectId });
        break;
      default:
        assertNever(gallery);
    }
  };

  return (
    <Modal show={isActive} size="xl" contentClassName="add-clipart-modal">
      <Modal.Header>clipart gallery</Modal.Header>
      <Modal.Body>
        <div style={{ overflowY: "scroll", maxHeight: "20rem" }}>
          {bodyContent(gallery, selectedIds, selectItemById, deselectItemById)}
        </div>
        <MaybeErrorOrSuccessReport
          messageWhenSuccess="Added!"
          attemptSucceeded={attemptSucceeded}
          maybeLastFailureMessage={maybeLastFailureMessage}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => dismiss()}>
          Cancel
        </Button>
        <Button
          disabled={noneSelected}
          variant="primary"
          onClick={() => maybeAttempt()}
        >
          Add to project
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
