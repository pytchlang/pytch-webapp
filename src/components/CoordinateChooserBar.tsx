import React from "react";
import { useTranslation } from "react-i18next";
import { useStoreActions, useStoreState } from "../store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "react-bootstrap/Button";
import classNames from "classnames";
import { EmptyProps, assertNever } from "../utils";
import { stageHalfHeight, stageHalfWidth } from "../constants";
import {
  CoordsChooserAnnouncement,
  StagePosition,
} from "../model/coordinates-chooser";

const CoordsChooserBarMessage: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("ide");

  // The message has to always take up the same amount of space
  // otherwise things jump around really annoyingly when stage is small.
  // So we stack both info messages in the same grid cell, and make just
  // the active one visible.  The invisible one is also hidden from
  // assistive technology by virtue of "visibility: hidden".

  const chooserState = useStoreState(
    (state) => state.ideLayout.coordsChooser.kind
  );
  const chosenPosition = useStoreState(
    (state) => state.ideLayout.coordsChooser.chosenPosition
  );

  if (chooserState === "idle") {
    // Shouldn't happen
    return null;
  }

  const isShowingCopied = chooserState === "active-with-copied-message";

  const infoClass = (isActive: boolean, extraClass?: string) =>
    classNames("info", extraClass, { isActive });

  const asStr = (n: number) => n.toString().padStart(4, " ");
  const xStr = asStr(chosenPosition.stageX);
  const yStr = asStr(chosenPosition.stageY);

  return (
    <div className="CoordsChooserBarMessage">
      <span className="coords">
        <code>
          (<span className="label">x:</span> {xStr},{" "}
          <span className="label">y:</span> {yStr})
        </code>
      </span>
      <span className="info-stack">
        <span className={infoClass(!isShowingCopied)}>
          {t("coords-chooser.click-or-enter-to-copy")}
        </span>
        <span className={infoClass(isShowingCopied, "copied")}>
          {t("coords-chooser.copied")}
        </span>
      </span>
    </div>
  );
};

const useAnnouncementText = (announcement: CoordsChooserAnnouncement) => {
  const { t } = useTranslation("ide");

  const positionText = ({ stageX, stageY }: StagePosition) =>
    t("coords-chooser.announce.position", {
      replace: { x: stageX, y: stageY },
    });

  switch (announcement.kind) {
    case "moved": {
      const { stageX, stageY } = announcement.position;
      const edgeTexts = [
        stageX === -stageHalfWidth && t("coords-chooser.announce.left-edge"),
        stageX === stageHalfWidth && t("coords-chooser.announce.right-edge"),
        stageY === stageHalfHeight && t("coords-chooser.announce.top-edge"),
        stageY === -stageHalfHeight && t("coords-chooser.announce.bottom-edge"),
      ].filter((text) => text !== false);
      return [positionText(announcement.position), ...edgeTexts].join(", ");
    }
    case "copied":
      return t("coords-chooser.announce.copied", {
        replace: { position: positionText(announcement.position) },
      });
    default:
      return assertNever(announcement);
  }
};

type AnnouncementProps = { announcement: CoordsChooserAnnouncement };
const Announcement: React.FC<AnnouncementProps> = ({ announcement }) => {
  const text = useAnnouncementText(announcement);
  return <span>{text}</span>;
};

// Live region for screen-reader announcements.  This must be rendered
// whether or not the chooser is active, because a live region only
// reliably announces changes made after it is already in the DOM.  Key
// the content on the announcement's seqnum so that React replaces the
// node even if the text is unchanged (e.g., pressing an arrow key when
// already at the edge), so the announcement is still spoken.
export const CoordsChooserAnnouncer: React.FC<EmptyProps> = () => {
  const announcement = useStoreState(
    (state) => state.ideLayout.coordsChooser.announcement
  );

  return (
    <div
      className="CoordsChooserAnnouncer visually-hidden"
      aria-live="polite"
      aria-atomic="true"
    >
      {announcement != null && (
        <Announcement key={announcement.seqnum} announcement={announcement} />
      )}
    </div>
  );
};

export const CoordinateChooserBar: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("ide");
  const setState = useStoreActions(
    (actions) => actions.ideLayout.coordsChooser.setStateKind
  );
  const dismiss = () => setState("idle");

  return (
    <div className="CoordinateChooserBar">
      <CoordsChooserBarMessage />
      <Button
        variant="secondary"
        className="close-button"
        onClick={dismiss}
        aria-label={t("coords-chooser.close")}
      >
        <FontAwesomeIcon icon={["far", "times-circle"]} />
      </Button>
    </div>
  );
};
