import React, { CSSProperties, MouseEventHandler } from "react";
import Modal from "react-bootstrap/Modal";
import { Button, Spinner } from "react-bootstrap";
import { Actions } from "easy-peasy";
import { useStoreState } from "../../store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { nSelectedItemsInGallery } from "../../model/clipart-gallery";
import {
  ClipArtGalleryData,
  ClipArtGalleryEntryId,
  ClipArtGalleryEntry,
  entryMatchesTag,
} from "../../model/clipart-gallery-core";

import { assertNever, mDataAttrIntValue } from "../../utils";
import { asyncFlowModal } from "../async-flow-modals/utils";
import {
  isInteractable,
  settleFunctions,
} from "../../model/user-interactions/async-user-flow";
import { useFlowActions, useFlowState } from "../../model";
import { FocusGroupContainer } from "../FocusGroupContainer";
import { focusGroupItemClass } from "../../model/junior/grouped-focus";
import { useFocusContext } from "../hooks/focus-steering";
import { useActionAsEffect } from "../hooks/use-action-as-effect";
import {
  AddClipArtFlow,
  AddClipArtRunState,
  groupedFocusKeyFromFilterState,
} from "../../model/user-interactions/clipart-gallery-select";
import { TwoStateSwitch } from "../TwoStateSwitch";
import { useTranslation } from "react-i18next";
import { AddAssetFailuresList } from "./AddAssetFailuresList";
import { ErrorMessageDisplay } from "../ErrorMessageDisplay";

const kMaxImageWidthOrHeight = 100;

const styleClampingToSize = (width: number, height: number): CSSProperties => {
  if (width > height && width > kMaxImageWidthOrHeight)
    return { width: kMaxImageWidthOrHeight };
  if (height >= width && height > kMaxImageWidthOrHeight)
    return { height: kMaxImageWidthOrHeight };
  return {};
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
      role="button"
      aria-pressed={isSelected}
      data-media-lib-entry-id={galleryEntry.id}
      data-is-selected={isSelected ? 1 : 0}
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

type MaybeTagFilterSwitchProps = Pick<AddClipArtRunState, "filterState">;
const MaybeTagFilterSwitch: React.FC<MaybeTagFilterSwitchProps> = ({
  filterState,
}) => {
  const setFilterActive = useFlowActions(
    (f) => f.addClipArtFlow.setFilterActive
  );

  if (filterState.kind === "always-all") {
    return <div />;
  }

  const setFilterActiveNegated = (showAll: boolean) => {
    setFilterActive(!showAll);
  };

  return (
    <TwoStateSwitch
      className="all-vs-tutorial-switch"
      i18nSpec={{ keyPart: "add.media-library.switch", ns: "assets" }}
      boolState={!filterState.active}
      setBoolState={setFilterActiveNegated}
    />
  );
};

type SelectionState = Pick<AddClipArtRunState, "selectedIds" | "filterState">;
type SelectionActions = Pick<
  Actions<AddClipArtFlow>,
  "selectItemById" | "deselectItemById"
>;
type SelectionProps = SelectionState & SelectionActions;

type ClipArtGalleryPanelReadyProps = {
  gallery: ClipArtGalleryData;
} & SelectionProps;

const ClipArtGalleryPanelReady: React.FC<ClipArtGalleryPanelReadyProps> = ({
  gallery,
  selectedIds,
  filterState,
  selectItemById,
  deselectItemById,
}) => {
  const selectedIdsSet = new Set(selectedIds);

  // For an initial implementation, bookmark position in the list
  // separately depending on whether a tag filter is active.  A better
  // alternative might be to remember a "target" entry and move the
  // bookmark to the entry closest to it when filterActive changes, but
  // that's quite a lot of work for a gain in usability which is not
  // obviously large.
  const groupedFocusKey = groupedFocusKeyFromFilterState(filterState);

  const onActivate = (elt: HTMLElement) => {
    const entryId = mDataAttrIntValue(elt, "mediaLibEntryId");
    const entrySelectedInt = mDataAttrIntValue(elt, "isSelected");
    if (entryId != null && entrySelectedInt != null) {
      if (entrySelectedInt === 1) {
        deselectItemById(entryId);
      } else {
        selectItemById(entryId);
      }
    }
  };

  const preventDefaultAfterOnActivate = true;

  const allEntries = gallery.entries;
  const entriesToShow =
    filterState.kind === "switchable" && filterState.active
      ? allEntries.filter((entry) => entryMatchesTag(entry, filterState.tag))
      : allEntries;

  return (
    <>
      <FocusGroupContainer
        groupedFocusKey={groupedFocusKey}
        className="clipart-gallery"
        opts={{ onActivate, preventDefaultAfterOnActivate }}
      >
        <ul className="ClipArtEntriesList">
          {entriesToShow.map((entry) => {
            const isSelected = selectedIdsSet.has(entry.id);
            return (
              <li key={entry.id} className="ClipArtEntryItem">
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
      return <ErrorMessageDisplay errorSpec={gallery.messageSpec} />;
    case "fetch-not-started":
    case "fetch-pending":
      return (
        <div className="text-center my-5">
          <Spinner animation="border" />
        </div>
      );
    case "ready":
      return <ClipArtGalleryPanelReady {...{ gallery, ...selectionProps }} />;
    default:
      return assertNever(gallery);
  }
};

export const AddClipArtModal = () => {
  const { t } = useTranslation("assets");
  const { t: tCommon } = useTranslation("common");
  const { fsmState, isSubmittable } = useFlowState((f) => f.addClipArtFlow);
  const { selectItemById, deselectItemById } = useFlowActions(
    (f) => f.addClipArtFlow
  );

  const galleryState = useStoreState((state) => state.clipArtGallery.state);

  useActionAsEffect(
    (actions) => actions.clipArtGallery.startFetchIfRequired
  );

  return asyncFlowModal(fsmState, (activeState) => {
    switch (activeState.kind) {
      case "awaiting-ack-of-notification": {
        // Currently the media library only contains images.
        return (
          <AddAssetFailuresList
            assetKind="image"
            failures={activeState.outcomeNub.failures}
            dismiss={activeState.userAck}
          />
        );
      }

      case "attempting":
      case "interacting": {
        const { selectedIds, filterState, operationContext } =
          activeState.runState;
        const { scope, assetKind } = operationContext;
        const keyStem = `add.${assetKind}` as const;

        const settle = settleFunctions(isSubmittable, activeState);

        const nSelected = nSelectedItemsInGallery(galleryState, selectedIds);

        const buttonKey =
          `add.media-library.${scope}.interacting.button` as const;

        const buttonContent =
          activeState.kind === "attempting" ? (
            <Spinner size="sm" />
          ) : (
            t(buttonKey, { count: nSelected })
          );

        const selectionProps: SelectionProps = {
          selectedIds,
          filterState,
          selectItemById,
          deselectItemById,
        };

        return (
          <Modal onHide={settle.cancel} animation={false} show={true} size="xl">
            <Modal.Header
              className="clipart-header"
              closeButton={isInteractable(activeState)}
            >
              <Modal.Title>{t(`${keyStem}.interacting.title`)}</Modal.Title>
              <MaybeTagFilterSwitch filterState={filterState} />
            </Modal.Header>
            <Modal.Body className="clipart-body">
              <ClipArtGalleryPanel {...selectionProps} />
            </Modal.Body>
            <Modal.Footer className="clipart-footer">
              <div className="licence-info">
                <p>{t("add.media-library.copyright-info")}</p>
              </div>
              <div className="buttons">
                <Button variant="secondary" onClick={settle.cancel}>
                  {tCommon("button.cancel")}
                </Button>
                <Button
                  className="maybe-submit"
                  disabled={!isSubmittable}
                  variant="primary"
                  onClick={settle.submit}
                >
                  {buttonContent}
                </Button>
              </div>
            </Modal.Footer>
          </Modal>
        );
      }

      default:
        return assertNever(activeState);
    }
  });
};
