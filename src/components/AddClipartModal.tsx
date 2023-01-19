import React, { useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import { Button } from "react-bootstrap";
import { useStoreState, useStoreActions } from "../store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ClipArtGalleryState } from "../model/clipart-gallery";
import { assertNever } from "../utils";
import { MaybeErrorOrSuccessReport } from "./MaybeErrorOrSuccessReport";

type ClipArtCardProps = {
  galleryItem: any; // TODO: Proper type
  isSelected: boolean;
  selectItemById: (id: number) => void;
  deselectItemById: (id: number) => void;
};
const ClipArtCard: React.FC<ClipArtCardProps> = ({
  galleryItem,
  isSelected,
  selectItemById,
  deselectItemById,
}) => {
  const extraClass = isSelected ? " selected" : " unselected";
  const clickHandler = isSelected ? deselectItemById : selectItemById;

  return (
    <div className="clipart-card" onClick={() => clickHandler(galleryItem.id)}>
      <p className="clipart-checkmark">
        <span className={`clipart-selection${extraClass}`}>
          <FontAwesomeIcon className="fa-lg" icon="check-circle" />
        </span>
      </p>
      <p className="clipart-name">{galleryItem.name}</p>
      <p className="clipart-thumbnail">
        <img alt="" style={{ width: 100 }} src={galleryItem.url} />
      </p>
    </div>
  );
};

const bodyContent = (
  gallery: ClipArtGalleryState,
  selectedIds: Array<number>,
  selectItemById: (id: number) => void,
  deselectItemById: (id: number) => void
) => {
  switch (gallery.status) {
    case "fetch-failed":
      return (
        <>
          <p>Sorry, something went wrong fetching the media library.</p>
          <p>{gallery.message}</p>
        </>
      );
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
              return (
                <li key={item.id}>
                  <ClipArtCard
                    galleryItem={item}
                    isSelected={isSelected}
                    selectItemById={selectItemById}
                    deselectItemById={deselectItemById}
                  />
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
  const nSelected = selectedIds.length;
  const noneSelected = nSelected === 0;

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

  const addLabel = noneSelected
    ? "Add to project"
    : `Add ${nSelected} to project`;

  return (
    <Modal animation={false} show={isActive} size="xl">
      <Modal.Header>
        <Modal.Title>Choose some images</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div style={{ overflowY: "scroll", maxHeight: "30rem" }}>
          {bodyContent(gallery, selectedIds, selectItemById, deselectItemById)}
        </div>
        <MaybeErrorOrSuccessReport
          messageWhenSuccess="Added!"
          attemptSucceeded={attemptSucceeded}
          maybeLastFailureMessage={maybeLastFailureMessage}
        />
      </Modal.Body>
      <Modal.Footer className="clipart-footer">
        <div className="buttons">
          <Button variant="secondary" onClick={() => dismiss()}>
            Cancel
          </Button>
          <Button
            disabled={noneSelected}
            variant="primary"
            onClick={() => maybeAttempt()}
          >
            {addLabel}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
