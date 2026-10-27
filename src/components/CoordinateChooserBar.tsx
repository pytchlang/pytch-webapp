import React from "react";
import { useTranslation } from "react-i18next";
import { useStoreActions, useStoreState } from "../store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "react-bootstrap/Button";
import classNames from "classnames";
import { EmptyProps } from "../utils";

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
          {t("coords-chooser.click-to-copy")}
        </span>
        <span className={infoClass(isShowingCopied, "copied")}>
          {t("coords-chooser.copied")}
        </span>
      </span>
    </div>
  );
};

export const CoordinateChooserBar: React.FC<EmptyProps> = () => {
  const setState = useStoreActions(
    (actions) => actions.ideLayout.coordsChooser.setStateKind
  );
  const dismiss = () => setState("idle");

  return (
    <div className="CoordinateChooserBar">
      <CoordsChooserBarMessage />
      <Button variant="secondary" className="close-button" onClick={dismiss}>
        <FontAwesomeIcon icon={["far", "times-circle"]} />
      </Button>
    </div>
  );
};
