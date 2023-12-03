import React from "react";

import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";

import { useStoreActions } from "../../store";

import {
  ActorKind,
  ActorKindOps,
  EventDescriptor,
  Uuid,
} from "../../model/junior/structured-program";
import { assertNever } from "../../utils";
import { descriptorFromBrowserKeyName } from "../../model/junior/keyboard-layout";
import { useJrEditActions } from "./hooks";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type DisplayVariant = "kind-chosen" | "fully-specified" | "in-editor";

type HatBlockContentProps = {
  actorKind: ActorKind;
  event: EventDescriptor;
  variant: DisplayVariant;
};
const HatBlockContent: React.FC<HatBlockContentProps> = ({
  actorKind,
  event,
  variant,
}) => {
  const text = (() => {
    switch (event.kind) {
      case "green-flag":
        return "when green flag clicked";
      case "clicked": {
        const targetLabel = ActorKindOps.names(actorKind).whenClickedNounPhrase;
        return `when ${targetLabel} clicked`;
      }
      case "start-as-clone":
        return "when I start as a clone";
      case "key-pressed": {
        const descriptor = descriptorFromBrowserKeyName(event.keyName);
        return `when "${descriptor.displayName}" key pressed`;
      }
      case "message-received": {
        return `when I receive "${event.message}"`;
      }
      default:
        return assertNever(event);
    }
  })();

  return <span className="content">{text}</span>;
};

type ReorderButtonsProps = {
  actorId: Uuid;
  handlerId: Uuid;
  prevHandlerId: Uuid | null;
  nextHandlerId: Uuid | null;
};
const ReorderButtons: React.FC<ReorderButtonsProps> = ({
  actorId,
  handlerId,
  prevHandlerId,
  nextHandlerId,
}) => {
  const reorderHandlers = useStoreActions(
    (actions) => actions.activeProject.reorderHandlers
  );

  const swapWithAdjacentFun = (targetHandlerId: Uuid | null) => () => {
    if (targetHandlerId == null) {
      return;
    }
    reorderHandlers({ actorId, movingHandlerId: handlerId, targetHandlerId });
  };

  const swapWithPrev = swapWithAdjacentFun(prevHandlerId);
  const swapWithNext = swapWithAdjacentFun(nextHandlerId);

  return (
    <div className="reorder-buttons">
      <Button
        className="swap-next"
        disabled={nextHandlerId == null}
        onClick={swapWithNext}
      >
        <FontAwesomeIcon icon="angles-down" />
      </Button>
      <Button
        className="swap-prev"
        disabled={prevHandlerId == null}
        onClick={swapWithPrev}
      >
        <FontAwesomeIcon icon="angles-up" />
      </Button>
    </div>
  );
};

type HatBlockProps = {
  actorId: Uuid;
  actorKind: ActorKind;
  handlerId: Uuid;
  prevHandlerId: Uuid | null;
  nextHandlerId: Uuid | null;
  event: EventDescriptor;
};
export const HatBlock: React.FC<HatBlockProps> = ({
  actorId,
  actorKind,
  handlerId,
  prevHandlerId,
  nextHandlerId,
  event,
}) => {
  const launchUpsertAction = useJrEditActions(
    (a) => a.upsertHatBlockInteraction.launch
  );

  const onChangeHatBlock = () => {
    launchUpsertAction({
      actorId,
      action: { kind: "update", handlerId, previousEvent: event },
    });
  };

  const deleteAction = useStoreActions(
    (actions) => actions.userConfirmations.launchDeleteJuniorHandler
  );
  const onDelete = () => deleteAction({ actorId, handlerId });

  return (
    <div className="HatBlock" onDoubleClick={onChangeHatBlock}>
      <div className="bump"></div>
      <div className="body">
        <HatBlockContent actorKind={actorKind} event={event} />
        <ReorderButtons
          {...{ actorId, handlerId, prevHandlerId, nextHandlerId }}
        />
        <DropdownButton
          title="⋮"
          align="end"
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <Dropdown.Item onClick={onChangeHatBlock}>
            Change hat block
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item className="danger" onClick={onDelete}>
            DELETE
          </Dropdown.Item>
        </DropdownButton>
      </div>
    </div>
  );
};
