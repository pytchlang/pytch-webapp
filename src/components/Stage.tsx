import React, { useEffect, useRef } from "react";
import { BrowserKeyboard } from "../skulpt-connection/browser-keyboard";
import { BrowserMouse } from "../skulpt-connection/browser-mouse";
import { IWebAppAPI, ProjectEngine } from "../skulpt-connection/drive-project";
import { useStoreActions, useStoreState } from "../store";
import { failIfNull } from "../utils";
import { VariableWatchers } from "./VariableWatchers";
import { CoordinateChooserOverlay } from "./CoordinateChooserOverlay";
import { eqDisplaySize } from "../model/ui";

const Stage = () => {
  console.log("rendering Stage");

  // The build sequence number is provided in a data attr for use in e2e
  // tests to ensure the build has actually completed before, e.g.,
  // sending keystrokes to the project.
  const buildSeqnum = useStoreState((state) => state.activeProject.buildSeqnum);
  const displaySize = useStoreState(
    (state) => state.ideLayout.stageDisplaySize,
    eqDisplaySize
  );
  const updatePointerStagePosition = useStoreActions(
    (actions) => actions.ideLayout.updatePointerStagePosition
  );

  const {
    reset: resetQuestion,
    setQuestion,
    maybeAcquireSubmission,
  } = useStoreActions((actions) => actions.userTextInput);

  const setVariableWatchers = useStoreActions(
    (actions) => actions.variableWatchers.setWatchers
  );

  const ensureNotFullScreen = useStoreActions(
    (actions) => actions.ideLayout.ensureNotFullScreen
  );

  const webAppAPI: IWebAppAPI = {
    clearUserQuestion: () => resetQuestion(),
    askUserQuestion: (q) => setQuestion(q),
    maybeAcquireUserInputSubmission: () => maybeAcquireSubmission(),

    setVariableWatchers: (ws) => setVariableWatchers(ws),

    ensureNotFullScreen: () => ensureNotFullScreen(),
  };

  const canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
  const bubblesRef: React.RefObject<HTMLDivElement> = React.createRef();

  const browserKeyboardRef = useRef<BrowserKeyboard | null>(null);
  const browserMouseRef = useRef<BrowserMouse | null>(null);
  const projectEngineRef = useRef<ProjectEngine | null>(null);

  useEffect(() => {
    console.log("Stage effect: setting up keyboard/mouse/engine", buildSeqnum);

    const canvas = failIfNull(
      canvasRef.current,
      "Stage effect: canvasRef is null"
    );
    const bubblesDiv = failIfNull(
      bubblesRef.current,
      "Stage effect: bubblesRef is null"
    );

    // All these ctors also "activate" the new object.
    browserKeyboardRef.current = new BrowserKeyboard(bubblesDiv);
    browserMouseRef.current = new BrowserMouse(bubblesDiv);
    projectEngineRef.current = new ProjectEngine(canvas, bubblesDiv, webAppAPI);

    resetQuestion();

    return () => {
      console.log("Stage effect: tearing down keyboard/mouse/engine");
      browserKeyboardRef.current?.deactivate();
      browserMouseRef.current?.deactivate();
      projectEngineRef.current?.requestHalt();
    };
  });

  const sizeStyle = {
    width: `${displaySize.width}px`,
    height: `${displaySize.height}px`,
  };

  return (
    <div id="pytch-stage-container" data-build-seqnum={buildSeqnum}>
      <div
        id="pytch-stage-layers"
        onMouseLeave={() => {
          updatePointerStagePosition({
            canvas: canvasRef.current,
            displaySize,
            mousePosition: null,
          });
        }}
        onMouseMove={(e) => {
          updatePointerStagePosition({
            canvas: canvasRef.current,
            displaySize,
            mousePosition: e,
          });
        }}
      >
        <canvas
          ref={canvasRef}
          id="pytch-canvas"
          width={displaySize.width}
          height={displaySize.height}
        />
        <VariableWatchers />
        <div
          ref={bubblesRef}
          id="pytch-speech-bubbles"
          style={sizeStyle}
          tabIndex={0}
        />
        <CoordinateChooserOverlay />
      </div>
    </div>
  );
};

export default Stage;
