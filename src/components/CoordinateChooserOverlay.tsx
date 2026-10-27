import React from "react";
import { useEffect, useId } from "react";
import { useTranslation } from "react-i18next";
import { useStoreActions, useStoreState } from "../store";
import { EmptyProps } from "../utils";
import {
  stageHalfHeight,
  stageHalfWidth,
  stageHeight,
  stageWidth,
} from "../constants";
import { MoveChosenPositionArgs } from "../model/coordinates-chooser";

// Arrow keys move by the coarse step; with Shift, by the fine step.
const kCoarseKeyboardStep = 10;
const kFineKeyboardStep = 1;

const moveArgsFromKeyEvent = (
  event: React.KeyboardEvent
): MoveChosenPositionArgs | null => {
  if (event.ctrlKey || event.altKey || event.metaKey) {
    return null;
  }
  const step = event.shiftKey ? kFineKeyboardStep : kCoarseKeyboardStep;
  switch (event.key) {
    case "ArrowLeft":
      return { kind: "by", dx: -step, dy: 0 };
    case "ArrowRight":
      return { kind: "by", dx: step, dy: 0 };
    case "ArrowUp":
      return { kind: "by", dx: 0, dy: step };
    case "ArrowDown":
      return { kind: "by", dx: 0, dy: -step };
    case "Home":
      return { kind: "to-origin" };
    default:
      return null;
  }
};

// Mark the chosen position, whether set by mouse or keyboard.  For a
// mouse user it sits under the pointer.
const Crosshair: React.FC<EmptyProps> = () => {
  const { stageX, stageY } = useStoreState(
    (state) => state.ideLayout.coordsChooser.chosenPosition
  );

  const left = `${(100 * (stageX + stageHalfWidth)) / stageWidth}%`;
  const top = `${(100 * (stageHalfHeight - stageY)) / stageHeight}%`;

  return (
    <div className="crosshair abs-0000" aria-hidden="true">
      <div className="h-line" style={{ top }} />
      <div className="v-line" style={{ left }} />
      <div className="ring" style={{ left, top }} />
    </div>
  );
};

export const CoordinateChooserOverlay: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("ide");
  const descriptionId = useId();

  const chooserState = useStoreState(
    (state) => state.ideLayout.coordsChooser.kind
  );

  const setState = useStoreActions(
    (actions) => actions.ideLayout.coordsChooser.setStateKind
  );
  const dismissChooserBar = () => setState("idle");

  const copyAction = useStoreActions(
    (actions) => actions.ideLayout.coordsChooser.maybeCopyCoords
  );
  const doCopy = () => copyAction();

  const moveChosenPosition = useStoreActions(
    (actions) => actions.ideLayout.coordsChooser.moveChosenPosition
  );

  const divRef = React.useRef<HTMLDivElement>(null);

  const handleKeyDown: React.KeyboardEventHandler = (event) => {
    if (event.key === "Escape") {
      dismissChooserBar();
      event.preventDefault();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      doCopy();
      event.preventDefault();
      return;
    }

    const moveArgs = moveArgsFromKeyEvent(event);
    if (moveArgs != null) {
      moveChosenPosition(moveArgs);
      event.preventDefault();
    }
  };

  // Only run this effect when the chooser becomes active or idle.  If
  // it ran on every render, the cleanup would move focus away when the
  // "Copied!" message came and went.
  const isActive = chooserState !== "idle";
  useEffect(() => {
    if (isActive) {
      divRef.current?.focus();
      return () => {
        // eslint-disable-next-line @eslint-react/web-api-no-leaked-timeout
        setTimeout(() => {
          document.getElementById("pytch-speech-bubbles")?.focus();
        });
      };
    }
  }, [isActive]);

  if (chooserState === "idle") {
    return null;
  }

  return (
    <>
      <div className="CoordinateChooserSubOverlay abs-0000" />
      <div
        ref={divRef}
        className="CoordinateChooserOverlay abs-0000"
        onKeyDown={handleKeyDown}
        onClick={doCopy}
        tabIndex={0}
        // Role "application" makes screen readers pass the arrow keys
        // through to us.
        role="application"
        aria-roledescription={t("coords-chooser.aria-roledescription")}
        aria-label={t("coords-chooser.aria-label")}
        aria-describedby={descriptionId}
      >
        <div id={descriptionId} className="visually-hidden">
          {t("coords-chooser.aria-description")}
        </div>
        {/* The rather unholy mix of DIVs and CSS (both inline and SCSS-driven)
            could probably be improved. */}
        <div className="grid" aria-hidden="true">
          <div className="v-centre abs-0000">
            <div className="x-axis" />
          </div>
          <div className="v-centre abs-0000">
            <div className="arrow" />
          </div>
          <div className="h-centre abs-0000">
            <div className="y-axis" />
          </div>
          <div className="h-centre abs-0000">
            <div className="arrow" />
          </div>
          <div className="v-centre abs-0000">
            <div className="origin" />
          </div>
          <div className="h-split abs-0000">
            <div />
            <div className="v-split">
              <div style={{ paddingLeft: "0.25rem", alignSelf: "end" }}>
                (0, 0)
              </div>
              <div />
            </div>
          </div>
          <div className="h-split x-ticks abs-0000">
            <div className="v-split">
              <div></div>
              <div>−240</div>
            </div>
            <div className="v-split" style={{ justifyItems: "end" }}>
              <div style={{ alignSelf: "end" }}>x</div>
              <div>240</div>
            </div>
          </div>
          <div className="v-split y-ticks abs-0000">
            <div className="h-split">
              <div style={{ justifySelf: "end" }}>180</div>
              <div className="pad">y</div>
            </div>
            <div className="h-split">
              <div style={{ justifySelf: "end", alignSelf: "end" }}>−180</div>
              <div></div>
            </div>
          </div>
        </div>
        <Crosshair />
      </div>
    </>
  );
};
