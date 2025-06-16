import React from "react";
import classNames from "classnames";

import Dropdown from "react-bootstrap/Dropdown";

import { useStoreActions } from "../../store";

import {
  ActorKind,
  ActorKindOps,
  EventDescriptor,
  HandlerUpsertionOperation,
  Uuid,
} from "../../model/junior/structured-program";
import { assertNever } from "../../utils";
import { descriptorFromBrowserKeyName } from "../../model/junior/keyboard-layout";
import {
  useActiveActorKind,
  useJrEditActions,
  useLaunchUpsertHatBlockFlow,
} from "./hooks";
import { CaptiveContextMenu } from "../CaptiveContextMenu";
import { useFocusContext } from "../hooks/focus-steering";

/** See docstring for `HatBlockContent`. */
type DisplayVariant = "kind-chosen" | "fully-specified" | "in-editor";

type HatBlockContentProps = {
  actorKind: ActorKind;
  event: EventDescriptor;
  variant: DisplayVariant;
};

/** Render the text contents of a hat-block for the given `event` within
 * an actor of the given `actorKind`.  The `variant` is one of:
 *
 * * `kind-chosen` — the appearance when in the "choose a hat block"
 *   dialog, before the user has supplied the argument (if any, i.e.,
 *   for key-pressed and message-received)
 * * `fully-specified` — the appearance when in the "choose a hat block"
 *   dialog, _after_ the user has supplied the argument, if any
 * * `in-editor` — the appearance as in the code editor
 * */
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
        const keyDescriptor = descriptorFromBrowserKeyName(event.keyName);
        const keyDisplayName = keyDescriptor.displayName;
        const argContent = (() => {
          switch (variant) {
            case "kind-chosen":
              // When launching "add script", starting key is space:
              return <span className="key-content">space</span>;
            case "fully-specified":
              return <span className="key-content">{keyDisplayName}</span>;
            case "in-editor":
              // TODO: Should this be the same as "fully-specified"?
              return `"${keyDisplayName}"`;
          }
        })();
        return <span>when {argContent} key pressed</span>;
      }
      case "message-received": {
        const message = event.message;
        const argContent = (() => {
          switch (variant) {
            case "kind-chosen":
              return (
                <span>
                  “<span className="message-placeholder">&nbsp;</span>”
                </span>
              );
            case "fully-specified":
              return (
                <span>
                  “<span className="message-content">{message}</span>”
                </span>
              );
            case "in-editor":
              // TODO: Should this be the same as "fully-specified"?
              return `"${message}"`;
          }
        })();
        return <span>when I receive {argContent}</span>;
      }
      default:
        return assertNever(event);
    }
  })();

  return <span className="content">{text}</span>;
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
  const focusContext = useFocusContext("per-method");
  const activeActorKind = useActiveActorKind();
  const reorderHandlers = useStoreActions(
    (actions) => actions.activeProject.reorderHandlers
  );

  const upsertionOperation: HandlerUpsertionOperation = {
    actorId,
    action: { kind: "update", handlerId, previousEvent: event },
  };
  const onChangeHatBlock = useLaunchUpsertHatBlockFlow(
    activeActorKind,
    upsertionOperation
  );

  const groupedFocusKey = `ActorProperties/${actorId}/code`;
  const swapWithAdjacentFun =
    (targetHandlerId: Uuid | null, bookmarkOffset: number) => () => {
      if (targetHandlerId != null) {
        reorderHandlers({
          actorId,
          movingHandlerId: handlerId,
          targetHandlerId,
        });

        // Defer updating bookmark until CodeEditor has re-rendered with
        // new order of scripts.
        setTimeout(() => {
          focusContext.focusOffsetItem(groupedFocusKey, bookmarkOffset);
        });
      }
    };

  const swapWithPrev = swapWithAdjacentFun(prevHandlerId, -1);
  const swapWithNext = swapWithAdjacentFun(nextHandlerId, 1);

  const duplicateHandlerAction = useStoreActions(
    (a) => a.activeProject.duplicateHandler
  );
  const onDuplicate = () => duplicateHandlerAction({ actorId, handlerId });

  const runDeleteFlow = useJrEditActions((a) => a.deleteHandlerFlow.run);
  const onDelete = () =>
    runDeleteFlow({
      actorId,
      handlerId,
      onDispose: focusContext.onDisposeDeleteScript,
    });

  return (
    <div className="HatBlock" onDoubleClick={onChangeHatBlock}>
      <div className="bump"></div>
      <div className="body">
        <HatBlockContent
          actorKind={actorKind}
          event={event}
          variant="in-editor"
        />
        <CaptiveContextMenu.DropdownMenu>
          <CaptiveContextMenu.DropdownItem onInvoke={onChangeHatBlock}>
            Change hat block
          </CaptiveContextMenu.DropdownItem>
          <CaptiveContextMenu.DropdownItem
            disabled={prevHandlerId == null}
            onInvoke={swapWithPrev}
          >
            Move script up
          </CaptiveContextMenu.DropdownItem>
          <CaptiveContextMenu.DropdownItem
            disabled={nextHandlerId == null}
            onInvoke={swapWithNext}
          >
            Move script down
          </CaptiveContextMenu.DropdownItem>
          <CaptiveContextMenu.DropdownItem onInvoke={onDuplicate}>
            Duplicate script
          </CaptiveContextMenu.DropdownItem>
          <Dropdown.Divider />
          <CaptiveContextMenu.DropdownItem
            className="danger"
            onInvoke={onDelete}
          >
            DELETE
          </CaptiveContextMenu.DropdownItem>
        </CaptiveContextMenu.DropdownMenu>
      </div>
    </div>
  );
};

export const DisplayHatBlock: React.FC<HatBlockContentProps> = (props) => {
  const classes = classNames("HatBlock", "display-only", props.variant);
  return (
    <div className={classes}>
      <div className="bump"></div>
      <div className="body">
        <HatBlockContent {...props} />
      </div>
    </div>
  );
};
