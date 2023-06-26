import React from "react";
import { useStoreState } from "../store";
import classNames from "classnames";
import { EmptyProps, assertNever } from "../utils";
import { PointerStagePosition } from "../model/ui";

const coordsOrPlaceholderSpan = (position: PointerStagePosition) => {
  switch (position.kind) {
    case "not-over-stage":
      return (
        <span className="coords spacer">
          <code>(+999, +999)</code>
        </span>
      );
    case "over-stage": {
      const asStr = (n: number) => n.toString().padStart(4, "   ");
      const xStr = asStr(position.stageX);
      const yStr = asStr(position.stageY);
      return (
        <span className="coords">
          <code>
            ({xStr}, {yStr})
          </code>
        </span>
      );
    }
    default:
      return assertNever(position);
  }
};

const CoordsChooserBarMessage: React.FC<EmptyProps> = () => {
  // These are the four cases, in terms of position-kind and
  // chooser-state-kind, and the message we want to display in each:

  // active / over-stage
  // (-123, 42) Click on stage to copy
  //
  // active / not-over-stage
  // Move over stage to see(x, y)
  //
  // active-with-copied-message / over-stage
  // (-123, 32) Copied!
  //
  // active-with-copied-message / not-over-stage
  // (+999, +999) Copied!
  // with fake coords invisible

  // Further, the message has to always take up the same amount of space
  // otherwise things jump around really annoyingly when stage is small.
  // So we create one <div> for each of the above (using placeholder values
  // when we don't have real coords), and then select just the active one
  // to be visible.

  const position = useStoreState(
    (state) => state.ideLayout.pointerStagePosition
  );
  const chooserState = useStoreState(
    (state) => state.ideLayout.coordsChooser.kind
  );

  if (chooserState === "idle") {
    // Shouldn't happen
    return null;
  }

  const isOverStage = position.kind === "over-stage";
  const isShowingCopied = chooserState === "active-with-copied-message";

  const coordsSpan = coordsOrPlaceholderSpan(position);

  const infoClass = (isActive: boolean, extraClass?: string) =>
    classNames("info", extraClass, { isActive });

  const msgNoCopiedOverStage = (
    <div>
      {coordsSpan}
      <span className={infoClass(!isShowingCopied && isOverStage)}>
        Click on stage to copy
      </span>
    </div>
  );

  const msgNoCopiedNotOverStage = (
    <div>
      <span className={infoClass(!isShowingCopied && !isOverStage)}>
        Move pointer over stage to see (x, y)
      </span>
    </div>
  );

  const msgCopiedOverStage = (
    <div>
      {coordsSpan}
      <span className={infoClass(isShowingCopied && isOverStage, "copied")}>
        Copied!
      </span>
    </div>
  );

  const msgCopiedNotOverStage = (
    <div>
      {coordsSpan}
      <span className={infoClass(isShowingCopied && !isOverStage, "copied")}>
        Copied!
      </span>
    </div>
  );

  return (
    <div className="CoordsChooserBarMessage">
      {msgCopiedOverStage}
      {msgCopiedNotOverStage}
      {msgNoCopiedOverStage}
      {msgNoCopiedNotOverStage}
    </div>
  );
};
