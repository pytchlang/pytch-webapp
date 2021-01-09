import React, { useEffect, useRef } from "react";
import { BrowserKeyboard } from "../skulpt-connection/browser-keyboard";
import { BrowserMouse } from "../skulpt-connection/browser-mouse";
import { ProjectEngine } from "../skulpt-connection/drive-project";
import { useStoreState } from "../store";
import { stageWidth, stageHeight } from "../constants";
import { failIfNull } from "../utils";

const Stage = () => {
  console.log("rendering Stage");

  // The build sequence number doesn't actually appear anywhere in
  // the rendered component, but depending on it causes a re-render
  // and a re-set-up of the mouse/keyboard/engine when there's a new
  // Sk.pytch.current_live_project.
  const buildSeqnum = useStoreState((state) => state.activeProject.buildSeqnum);

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

    bubblesDiv.tabIndex = -1;
    bubblesDiv.focus();

    // All these ctors also "activate" the new object.
    browserKeyboardRef.current = new BrowserKeyboard(bubblesDiv);
    browserMouseRef.current = new BrowserMouse(bubblesDiv);
    projectEngineRef.current = new ProjectEngine(canvas, bubblesDiv);

    return () => {
      console.log("Stage effect: tearing down keyboard/mouse/engine");
      browserKeyboardRef.current!.deactivate();
      browserMouseRef.current!.deactivate();
      projectEngineRef.current!.requestHalt();
    };
  });

  return (
    <div id="pytch-stage-container">
      <div id="pytch-stage-layers">
        <canvas
          ref={canvasRef}
          id="pytch-canvas"
          width={stageWidth}
          height={stageHeight}
        />
        <div ref={bubblesRef} id="pytch-speech-bubbles" />
      </div>
    </div>
  );
};

export default Stage;
