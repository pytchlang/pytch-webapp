import React, { CSSProperties, MouseEventHandler, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import { Button } from "react-bootstrap";
import { useStoreState, useStoreActions } from "../../store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { nSelectedItemsInGallery } from "../../model/clipart-gallery";
import {
  ClipArtGalleryData,
  ClipArtGalleryEntryId,
  ClipArtGalleryEntry,
  entryMatchesTags,
} from "../../model/clipart-gallery-core";

import { assertNever, discardReturnValue } from "../../utils";
import { MaybeErrorOrSuccessReport } from "../MaybeErrorOrSuccessReport";
import { asyncFlowModal } from "../async-flow-modals/utils";
import {
  isInteractable,
  isSucceeded,
  maybeLastFailureMessage,
  settleFunctions,
} from "../../model/user-interactions/async-user-flow";
import { OnTagClickFun } from "../../model/user-interactions/clipart-gallery-select";
import { useFlowActions, useFlowState } from "../../model";
import { FocusGroupContainer } from "../FocusGroupContainer";
import {
  focusGroupItemClass,
  kFocusGroupItemClassName,
} from "../../model/junior/grouped-focus";
import { useFocusContext } from "../hooks/focus-steering";

const kMaxImageWidthOrHeight = 100;

const styleClampingToSize = (width: number, height: number): CSSProperties => {
  if (width > height && width > kMaxImageWidthOrHeight)
    return { width: kMaxImageWidthOrHeight };
  if (height >= width && height > kMaxImageWidthOrHeight)
    return { height: kMaxImageWidthOrHeight };
  return {};
};

type ClipArtTagButtonProps = {
  label: string;
  tag: string;
  isSelected: boolean;
  onClick: MouseEventHandler;
};
const ClipArtTagButton: React.FC<ClipArtTagButtonProps> = ({
  label,
  tag,
  isSelected,
  onClick,
}) => {
  const baseVariant = label === "All" ? "success" : "primary";
  const variantPrefix = isSelected ? "" : "outline-";
  const variant = `${variantPrefix}${baseVariant}`;
  return (
    <Button
      className={kFocusGroupItemClassName}
      {...{ variant, onClick }}
      data-media-lib-tag={tag}
    >
      {label}
    </Button>
  );
};

type ClipArtTagButtonCollectionProps = {
  gallery: ClipArtGalleryData;
  selectedTags: Array<string>;
  onTagClick: OnTagClickFun;
};
const ClipArtTagButtonCollection: React.FC<ClipArtTagButtonCollectionProps> = ({
  gallery,
  selectedTags,
  onTagClick,
}) => {
  const focusCtx = useFocusContext();
  const allIsSelected = selectedTags.length === 0;

  type MouseEventHandlerFun = (tag: string) => MouseEventHandler<HTMLElement>;
  const clickFun: MouseEventHandlerFun = (tag: string) => (event) => {
    onTagClick({ tag, isMultiSelect: event.ctrlKey });
    focusCtx.onGroupItemClick(event);
  };

  const onActivate = (elt: HTMLElement) => {
    const tag = elt.dataset.mediaLibTag;
    if (tag == null) {
      console.warn("no media-lib-tag data attr");
      return;
    }
    onTagClick({ tag, isMultiSelect: false });
  };

  return (
    <FocusGroupContainer groupedFocusKey="MediaLibTags" opts={{ onActivate }}>
    <ul className="ClipArtTagButtonCollection">
      <li key="--all--">
        <ClipArtTagButton
          label="All"
          isSelected={allIsSelected}
          onClick={clickFun("--all--")}
          tag={"--all--"}
        />
      </li>
      {gallery.tags.map((tag) => (
        <li key={tag}>
          <ClipArtTagButton
            label={tag}
            isSelected={selectedTags.indexOf(tag) !== -1}
            onClick={clickFun(tag)}
            tag={tag}
          />
        </li>
      ))}
    </ul>
    </FocusGroupContainer>
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
  const focusCtx = useFocusContext();

  const extraClass = isSelected ? " selected" : " unselected";
  const clickHandler = isSelected ? deselectItemById : selectItemById;

  // Show the first item as representative of the entry.
  const galleryItem = galleryEntry.items[0];
  const nItems = galleryEntry.items.length;
  const nItemsLabel =
    nItems === 1 ? null : <div className="n-items-label">{nItems}</div>;

  const [rawImageWidth, rawImageHeight] = galleryItem.size;
  const thumbStyle = styleClampingToSize(rawImageWidth, rawImageHeight);

  const onClick: MouseEventHandler<HTMLElement> = (evt) => {
    clickHandler(galleryEntry.id);
    focusCtx.onGroupItemClick(evt);
  };

  return (
    <div
      className={focusGroupItemClass("clipart-card")}
      onClick={onClick}
    >
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

type SelectionProps = {
  selectedIds: Array<ClipArtGalleryEntryId>;
  selectedTags: Array<string>;
  selectItemById: (id: ClipArtGalleryEntryId) => void;
  deselectItemById: (id: ClipArtGalleryEntryId) => void;
  onTagClick: OnTagClickFun;
};

type ClipArtGalleryPanelReadyProps = {
  gallery: ClipArtGalleryData;
} & SelectionProps;

const ClipArtGalleryPanelReady: React.FC<ClipArtGalleryPanelReadyProps> = ({
  gallery,
  selectedIds,
  selectedTags,
  selectItemById,
  deselectItemById,
  onTagClick,
}) => {
  const selectedIdsSet = new Set(selectedIds);
  const selectedTagsSet = new Set<string>(selectedTags);

  // For an initial implementation, bookmark position in the list
  // separately depending what tags are selected.  A better alternative
  // might be to remember a "target" entry and move the bookmark to the
  // entry closest to it when selectedTags changes, but that's quite a
  // lot of work for a gain in usability which is not obviously large.
  let sortedTags = selectedTags.slice();
  sortedTags.sort();
  const groupedFocusKey = `MediaLibEntries-${sortedTags.join("/")}`;

  return (
    <>
      <ClipArtTagButtonCollection {...{ gallery, selectedTags, onTagClick }} />
      <div className="modal-separator" />
      <FocusGroupContainer
        groupedFocusKey={groupedFocusKey}
        className="clipart-gallery"
      >
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
      </FocusGroupContainer>
    </>
  );
};

const ClipArtGalleryPanel: React.FC<SelectionProps> = (selectionProps) => {
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
      return <ClipArtGalleryPanelReady {...{ gallery, ...selectionProps }} />;
    default:
      return assertNever(gallery);
  }
};

export const AddClipArtModal = () => {
  const { fsmState, isSubmittable } = useFlowState((f) => f.addClipArtFlow);
  const { selectItemById, deselectItemById, onTagClick } = useFlowActions(
    (f) => f.addClipArtFlow
  );

  const galleryState = useStoreState((state) => state.clipArtGallery.state);

  const startFetchIfRequired = useStoreActions((actions) =>
    discardReturnValue(actions.clipArtGallery.startFetchIfRequired)
  );

  useEffect(startFetchIfRequired);

  return asyncFlowModal(fsmState, (activeState) => {
    const { selectedIds, selectedTags } = activeState.runState;

    const settle = settleFunctions(isSubmittable, activeState);

    const nSelected = nSelectedItemsInGallery(galleryState, selectedIds);
    const noneSelected = nSelected === 0;

    const addLabel = noneSelected
      ? "Add to project"
      : `Add ${nSelected} to project`;

    const selectionProps: SelectionProps = {
      selectedIds,
      selectedTags,
      selectItemById,
      deselectItemById,
      onTagClick,
    };

    return (
      <Modal onHide={settle.cancel} animation={false} show={true} size="xl">
        <Modal.Header closeButton={isInteractable(activeState)}>
          <Modal.Title>Choose some images</Modal.Title>
        </Modal.Header>
        <Modal.Body className="clipart-body">
          <ClipArtGalleryPanel {...selectionProps} />
          <MaybeErrorOrSuccessReport
            messageWhenSuccess="Added!"
            attemptSucceeded={isSucceeded(activeState)}
            maybeLastFailureMessage={maybeLastFailureMessage(activeState)}
          />
        </Modal.Body>
        <Modal.Footer className="clipart-footer">
          <div className="licence-info">
            <p>For copyright and licensing information, see help pages.</p>
          </div>
          <div className="buttons">
            <Button variant="secondary" onClick={settle.cancel}>
              Cancel
            </Button>
            <Button
              disabled={!isSubmittable}
              variant="primary"
              onClick={settle.submit}
            >
              {addLabel}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    );
  });
};
