import React, { CSSProperties, MouseEventHandler, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import { Button } from "react-bootstrap";
import { useStoreState, useStoreActions } from "../store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { nSelectedItemsInGallery } from "../model/clipart-gallery";
import {
  ClipArtGalleryData,
  ClipArtGalleryEntryId,
  ClipArtGalleryEntry,
  entryMatchesTags,
  selectedEntries,
} from "../model/clipart-gallery-core";

import { EmptyProps, assertNever } from "../utils";
import { MaybeErrorOrSuccessReport } from "./MaybeErrorOrSuccessReport";

const kMaxImageWidthOrHeight = 100;

const styleClampingToSize = (width: number, height: number): CSSProperties => {
  if (width > height) {
    if (width > kMaxImageWidthOrHeight) {
      return { width: kMaxImageWidthOrHeight };
    } else {
      return {};
    }
  } else {
    if (height > kMaxImageWidthOrHeight) {
      return { height: kMaxImageWidthOrHeight };
    } else {
      return {};
    }
  }
};

type ClipArtTagButtonProps = {
  label: string;
  isSelected: boolean;
  onClick: MouseEventHandler;
};
const ClipArtTagButton: React.FC<ClipArtTagButtonProps> = ({
  label,
  isSelected,
  onClick,
}) => {
  const baseVariant = label === "All" ? "success" : "primary";
  const variantPrefix = isSelected ? "" : "outline-";
  const variant = `${variantPrefix}${baseVariant}`;
  return <Button {...{ variant, onClick }}>{label}</Button>;
};

type ClipArtTagButtonCollectionProps = { gallery: ClipArtGalleryData };
const ClipArtTagButtonCollection: React.FC<ClipArtTagButtonCollectionProps> = ({
  gallery,
}) => {
  const { selectedTags } = useStoreState(
    (state) => state.userConfirmations.addClipArtItemsInteraction
  );
  const { onTagClick } = useStoreActions(
    (actions) => actions.userConfirmations.addClipArtItemsInteraction
  );

  const allIsSelected = selectedTags.length === 0;

  type MouseEventHandlerFun = (tag: string) => MouseEventHandler;
  const clickFun: MouseEventHandlerFun = (tag: string) => (event) =>
    onTagClick({ tag, isMultiSelect: event.ctrlKey });

  return (
    <ul className="ClipArtTagButtonCollection">
      <li key="--all--">
        <ClipArtTagButton
          label="All"
          isSelected={allIsSelected}
          onClick={clickFun("--all--")}
        />
      </li>
      {gallery.tags.map((tag) => (
        <li key={tag}>
          <ClipArtTagButton
            label={tag}
            isSelected={selectedTags.indexOf(tag) !== -1}
            onClick={clickFun(tag)}
          />
        </li>
      ))}
    </ul>
  );
};

type ClipArtCardProps = {
  galleryEntry: ClipArtGalleryEntry;
  isSelected: boolean;
  selectItemById: (id: ClipArtGalleryEntryId) => void;
  deselectItemById: (id: ClipArtGalleryEntryId) => void;
};
const ClipArtCard: React.FC<ClipArtCardProps> = ({
  galleryEntry,
  isSelected,
  selectItemById,
  deselectItemById,
}) => {
  const extraClass = isSelected ? " selected" : " unselected";
  const clickHandler = isSelected ? deselectItemById : selectItemById;

  // Show the first item as representative of the entry.
  const galleryItem = galleryEntry.items[0];
  const nItems = galleryEntry.items.length;
  const nItemsLabel =
    nItems === 1 ? null : <div className="n-items-label">{nItems}</div>;

  const [rawImageWidth, rawImageHeight] = galleryItem.size;
  const thumbStyle = styleClampingToSize(rawImageWidth, rawImageHeight);

  return (
    <div className="clipart-card" onClick={() => clickHandler(galleryEntry.id)}>
      <div className="decorations">
        <p className="clipart-checkmark">
          <span className={`clipart-selection${extraClass}`}>
            <FontAwesomeIcon className="fa-lg" icon="check-circle" />
          </span>
        </p>
        {nItemsLabel}
      </div>
      <p className="clipart-thumbnail">
        <img alt="" style={thumbStyle} src={galleryItem.url} />
      </p>
      <p className="clipart-name">{galleryEntry.name}</p>
    </div>
  );
};

type ClipArtGalleryPanelReadyProps = { gallery: ClipArtGalleryData };
const ClipArtGalleryPanelReady: React.FC<ClipArtGalleryPanelReadyProps> = ({
  gallery,
}) => {
  const { selectedIds, selectedTags } = useStoreState(
    (state) => state.userConfirmations.addClipArtItemsInteraction
  );
  const { selectItemById, deselectItemById } = useStoreActions(
    (actions) => actions.userConfirmations.addClipArtItemsInteraction
  );

  const selectedIdsSet = new Set(selectedIds);
  const selectedTagsSet = new Set<string>(selectedTags);

  return (
    <>
      <ClipArtTagButtonCollection {...{ gallery }} />
      <div className="modal-separator" />
      <div className="clipart-gallery">
        <ul>
          {gallery.entries.map((entry) => {
            if (!entryMatchesTags(entry, selectedTagsSet)) return null;

            const isSelected = selectedIdsSet.has(entry.id);
            return (
              <li key={entry.id}>
                <ClipArtCard
                  galleryEntry={entry}
                  isSelected={isSelected}
                  selectItemById={selectItemById}
                  deselectItemById={deselectItemById}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

const ClipArtGalleryPanel: React.FC<EmptyProps> = () => {
  const gallery = useStoreState((state) => state.clipArtGallery.state);

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
      return <ClipArtGalleryPanelReady {...{ gallery }} />;
    default:
      return assertNever(gallery);
  }
};

export const AddClipartModal = () => {
  const {
    operationContext,
    assetNamePrefix,
    isActive,
    isInteractable,
    attemptSucceeded,
    maybeLastFailureMessage,
    selectedIds,
  } = useStoreState(
    (state) => state.userConfirmations.addClipArtItemsInteraction
  );
  const { attempt, dismiss } = useStoreActions(
    (actions) => actions.userConfirmations.addClipArtItemsInteraction
  );

  const gallery = useStoreState((state) => state.clipArtGallery.state);
  const startFetchIfRequired = useStoreActions(
    (actions) => actions.clipArtGallery.startFetchIfRequired
  );

  const nSelected = nSelectedItemsInGallery(gallery, selectedIds);
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
        // the data is ready.
        console.warn(`unexpected gallery state ${gallery.status}`);
        break;
      case "ready": {
        const allEntries = gallery.entries;
        const entriesToAdd = selectedEntries(allEntries, selectedIds);
        attempt({
          operationContext,
          assetNamePrefix,
          entries: entriesToAdd,
          projectId,
        });
        break;
      }
      default:
        assertNever(gallery);
    }
  };

  const addLabel = noneSelected
    ? "Add to project"
    : `Add ${nSelected} to project`;

  // TODO: Move the none-selected logic into inputsReady?
  const addButtonIsEnabled = isInteractable && !noneSelected;

  return (
    <Modal animation={false} show={isActive} size="xl">
      <Modal.Header>
        <Modal.Title>Choose some images</Modal.Title>
      </Modal.Header>
      <Modal.Body className="clipart-body">
        <ClipArtGalleryPanel />
        <MaybeErrorOrSuccessReport
          messageWhenSuccess="Added!"
          attemptSucceeded={attemptSucceeded}
          maybeLastFailureMessage={maybeLastFailureMessage}
        />
      </Modal.Body>
      <Modal.Footer className="clipart-footer">
        <div className="licence-info">
          <p>For copyright and licensing information, see help pages.</p>
        </div>
        <div className="buttons">
          <Button variant="secondary" onClick={() => dismiss()}>
            Cancel
          </Button>
          <Button
            disabled={!addButtonIsEnabled}
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
