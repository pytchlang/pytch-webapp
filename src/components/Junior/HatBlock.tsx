import React from "react";

import Dropdown from "react-bootstrap/Dropdown";

import { useStoreActions } from "../../store";

import {
  ActorKind,
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
  useReorderScriptFuncs,
} from "./hooks";
import { CaptiveContextMenu } from "../CaptiveContextMenu";
import { useFocusContext } from "../hooks/focus-steering";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Trans, useTranslation } from "react-i18next";

/** See docstring for `HatBlockContent`. */
type DisplayVariant = "kind-chosen" | "fully-specified";

type HatBlockContentProps = {
  actorKind: ActorKind;
  event: EventDescriptor;
  variant: DisplayVariant;
};

const HatContentNub: React.FC<HatBlockContentProps> = ({
  actorKind,
  event,
  variant,
}) => {
  switch (event.kind) {
    case "green-flag":
      return <Trans i18nKey="hat-block-content.green-flag" ns="ide" />;
    case "clicked":
      return (
        <Trans i18nKey={`hat-block-content.clicked.${actorKind}`} ns="ide" />
      );
    case "start-as-clone":
      return <Trans i18nKey="hat-block-content.start-as-clone" ns="ide" />;
    case "key-pressed": {
      const browserKey = variant === "kind-chosen" ? " " : event.keyName;
      const keyName = descriptorFromBrowserKeyName(browserKey).displayName;
      return (
        <Trans
          i18nKey="hat-block-content.key-pressed"
          ns="ide"
          components={{
            key: <span className="key-content">{keyName}</span>,
          }}
        />
      );
    }
    case "message-received": {
      const message = variant === "kind-chosen" ? "\u00a0" : event.message;
      return (
        <Trans
          i18nKey="hat-block-content.message-received"
          ns="ide"
          components={{
            msg: <span className="message-content">{message}</span>,
          }}
        />
      );
    }
    default:
      return assertNever(event);
  }
};

/** Render the text contents of a hat-block for the given `event` within
 * an actor of the given `actorKind`.  The `variant` is one of:
 *
 * * `kind-chosen` — the appearance when in the "choose a hat block"
 *   dialog, before the user has supplied the argument (if any, i.e.,
 *   for key-pressed and message-received); a placeholder value is shown
 * * `fully-specified` — the event's actual arg value is shown
 * */
const HatBlockContent: React.FC<HatBlockContentProps> = (props) => (
  <span className="content">
    <HatContentNub {...props} />
  </span>
);

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
  const { t } = useTranslation("ide");
  const { t: tCommon } = useTranslation("common");
  const focusContext = useFocusContext("per-method");
  const activeActorKind = useActiveActorKind();

  const upsertionOperation: HandlerUpsertionOperation = {
    actorId,
    action: { kind: "update", handlerId, previousEvent: event },
  };
  const onChangeHatBlock = useLaunchUpsertHatBlockFlow(
    activeActorKind,
    upsertionOperation
  );

  const { swapWithPrev, swapWithNext } = useReorderScriptFuncs(actorId, {
    prev: prevHandlerId,
    self: handlerId,
    next: nextHandlerId,
  });

  const duplicateHandlerAction = useStoreActions(
    (a) => a.activeProject.duplicateHandlerAndNotify
  );
  const onDuplicate = () => {
    const groupedFocusKey = `ActorProperties/${actorId}/code`;
    duplicateHandlerAction({ actorId, handlerId });

    // Defer updating bookmark until CodeEditor has re-rendered with the
    // newly-duplicated script.  The new script appears after the
    // original, which must have been focused (and so bookmarked), so
    // increasing the bookmark by 1 makes the new script have focus.  Do
    // not actually focus the entire script; we focus the editor.
    setTimeout(() => {
      focusContext.bookmarkMaybeFocusOffsetItem(groupedFocusKey, 1, {
        doFocus: false,
      });
    });
  };

  const runDeleteFlow = useJrEditActions((a) => a.deleteHandlerFlow.run);
  const onDelete = () =>
    runDeleteFlow({
      actorId,
      handlerId,
      onDispose: focusContext.onDisposeDeleteScript,
    });

  return (
    <div
      className="HatBlock"
      onDoubleClick={onChangeHatBlock}
      data-event-handler-kind={event.kind}
    >
      {/*<div className="bump"></div>*/}
      <div className="body">
        <HatBlockContent
          actorKind={actorKind}
          event={event}
          variant="fully-specified"
        />
        <CaptiveContextMenu.DropdownMenu
          toggle={<FontAwesomeIcon icon={"caret-down"} />}
        >
          <CaptiveContextMenu.DropdownItem onInvoke={onChangeHatBlock}>
            {t("script.action.change-hat-block")}
          </CaptiveContextMenu.DropdownItem>
          <CaptiveContextMenu.DropdownItem
            disabled={prevHandlerId == null}
            onInvoke={swapWithPrev}
          >
            {t("script.action.move-earlier")}
          </CaptiveContextMenu.DropdownItem>
          <CaptiveContextMenu.DropdownItem
            disabled={nextHandlerId == null}
            onInvoke={swapWithNext}
          >
            {t("script.action.move-later")}
          </CaptiveContextMenu.DropdownItem>
          <CaptiveContextMenu.DropdownItem onInvoke={onDuplicate}>
            {t("script.action.duplicate")}
          </CaptiveContextMenu.DropdownItem>
          <Dropdown.Divider />
          <CaptiveContextMenu.DropdownItem
            className="danger"
            onInvoke={onDelete}
          >
            {tCommon("action.delete")}
          </CaptiveContextMenu.DropdownItem>
        </CaptiveContextMenu.DropdownMenu>
      </div>
    </div>
  );
};

export const DisplayHatBlock: React.FC<HatBlockContentProps> = (props) => {
  return (
    <div className="HatBlock display-only">
      {/*<div className="bump"></div>*/}
      <div className="body">
        <HatBlockContent {...props} />
      </div>
    </div>
  );
};
