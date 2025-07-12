import React, { CSSProperties, useEffect } from "react";
import { useParams } from "react-router-dom";

import { EmptyProps, OnlyChildrenProps, assertNever } from "../utils";

import { envVarOrDefault } from "../env-utils";

import { useStoreActions, useStoreState } from "../store";
import { Actions, State } from "easy-peasy";

import { BuildOutcomeKind, build } from "../skulpt-connection/build";
import { eqDisplaySize, fullScreenStageDisplaySize } from "../model/ui";

import {
  StandalonePlayDemoState,
  stateHasProject,
} from "../model/standalone-play-demo";

import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import Stage from "./Stage";
import QuestionInputPanel from "./QuestionInputPanel";
import { RedStop } from "./StageControls";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "../pytch-standalone-play-demo.scss";

////////////////////////////////////////////////////////////////////////
// Utilities for using slice's state/actions.

type SPDStateMapper<R> = (state: State<StandalonePlayDemoState>) => R;
type SPDActionsMapper<R> = (actions: Actions<StandalonePlayDemoState>) => R;

function useSPDState<R>(mapState: SPDStateMapper<R>): R {
  return useStoreState((state) => mapState(state.standalonePlayDemoState));
}

function useSPDActions<R>(mapActions: SPDActionsMapper<R>): R {
  return useStoreActions((actions) =>
    mapActions(actions.standalonePlayDemoState)
  );
}

////////////////////////////////////////////////////////////////////////
// Hook for computing width/height styles to match stage dimensions.

type UseStageDimensionsStyleArgs = {
  includeHeight: boolean;
};

const useStageDimensionsStyle = ({
  includeHeight,
}: UseStageDimensionsStyleArgs): CSSProperties => {
  const stageDimensions = useStoreState(
    (state) => state.ideLayout.stageDisplaySize,
    eqDisplaySize
  );

  let style: CSSProperties = { width: `${stageDimensions.width}px` };
  if (includeHeight) {
    style.height = `${stageDimensions.height}px`;
  }

  return style;
};

////////////////////////////////////////////////////////////////////////
// Sub-components.

const MadeWithPytchButton: React.FC<EmptyProps> = () => {
  const url = envVarOrDefault("BASE_URL", "https://pytch.org/");
  return (
    <div className="MadeWithPytchButton">
      <p>
        <a href={url} target="_blank" rel="noreferrer">
          <span className="pseudo-link">Made with Pytch</span>
        </a>
      </p>
    </div>
  );
};

const ErrorNotice: React.FC<OnlyChildrenProps> = ({ children }) => {
  const dimensionsStyle = useStageDimensionsStyle({ includeHeight: true });
  return (
    <div className="ErrorNotice mx-auto" style={dimensionsStyle}>
      <div>
        <FontAwesomeIcon
          className="mb-3"
          size="2x"
          icon="exclamation-triangle"
        />
        {children}
      </div>
    </div>
  );
};

const SizedSpinner: React.FC<EmptyProps> = () => {
  const dimensionsStyle = useStageDimensionsStyle({ includeHeight: true });
  return (
    <div className="spinner-container mx-auto" style={dimensionsStyle}>
      <Spinner animation="border" />
    </div>
  );
};

const DemoContent: React.FC<EmptyProps> = () => {
  const state = useSPDState((s) => s.coreState);

  switch (state.kind) {
    case "idle":
    case "booting":
      return <SizedSpinner />;
    case "boot-failed":
      return (
        <ErrorNotice>
          <p>Sorry, this Pytch program could not be loaded.</p>
        </ErrorNotice>
      );
    case "build-failed":
      return (
        <ErrorNotice>
          <p>Sorry, this Pytch program could not be started.</p>
        </ErrorNotice>
      );
    case "ready":
    case "launched":
      return (
        <div className="stage-and-text-input">
          <Stage />
          <QuestionInputPanel />
        </div>
      );
    case "runtime-error":
      return (
        <ErrorNotice>
          <p>Sorry, this Pytch program encountered an error.</p>
          <p>
            You can try re-running the program by clicking the green button
            above the stage.
          </p>
        </ErrorNotice>
      );
    default:
      return assertNever(state);
  }
};

////////////////////////////////////////////////////////////////////////
// Main component.

export const StandalonePlayDemo: React.FC<EmptyProps> = () => {
  const params = useParams();
  const state = useSPDState((s) => s.coreState);
  const widthOfStageStyle = useStageDimensionsStyle({ includeHeight: false });

  const noteLoadFailed = useSPDActions((a) => a.noteBootFailed);
  const bootIfRequired = useSPDActions((a) => a.bootIfRequired);
  const noteBuildFailed = useSPDActions((a) => a.noteBuildFailed);
  const noteLaunched = useSPDActions((a) => a.noteLaunched);
  const noteErrorOccurred = useSPDActions((a) => a.noteRuntimeError);

  const incrementBuildSeqnum = useStoreActions(
    (actions) => actions.activeProject.incrementBuildSeqnum
  );
  const setStageDisplayWidth = useStoreActions(
    (actions) => actions.ideLayout.setStageDisplayWidth
  );

  useEffect(() => {
    if (params.buildId == null || params.demoId == null) {
      noteLoadFailed(); // Shouldn't happen.
    } else {
      bootIfRequired({ buildId: params.buildId, demoId: params.demoId });
    }

    const handleResize = () => {
      // This "36" is the height of the controls; ideally we would get
      // this from somewhere definitive, not hard-code it.
      const layout = fullScreenStageDisplaySize(36);
      setStageDisplayWidth(layout.width);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    if (state.kind === "ready") {
      onGreenFlag();
    }

    return () => window.removeEventListener("resize", handleResize);
  });

  const onGreenFlag = async () => {
    if (!stateHasProject(state)) {
      return;
    }

    const mOutElt = document.getElementById("pytch-hidden-stdout");

    const buildResult = await build(
      state.project,
      (_outputChunk) => {
        if (mOutElt != null) {
          mOutElt.dataset.capturedStdout += _outputChunk;
        }
      },
      (_pytchError, _errorContext) => {
        // TODO: Could put up button saying "launch Pytch (in new tab)
        // with this project so you can debug".
        noteErrorOccurred();
      }
    );

    if (buildResult.kind === BuildOutcomeKind.Success) {
      if (mOutElt != null) {
        mOutElt.dataset.capturedStdout = "";
      }
      noteLaunched();
      incrementBuildSeqnum(); // Rerender Stage; new ProjectEngine.
    } else {
      noteBuildFailed();
    }
  };

  const greenFlag = (
    <Button
      className="StageControlPseudoButton GreenFlag"
      onClick={onGreenFlag}
    >
      <FontAwesomeIcon icon="play" />
    </Button>
  );

  return (
    <main className="StandalonePlayDemo abs-0000">
      <div className="StageWithControls">
        <div className="StageControls" style={widthOfStageStyle}>
          <div className="run-stop-controls">
            {greenFlag}
            <RedStop />
          </div>
          <MadeWithPytchButton />
        </div>
        <DemoContent />
      </div>
      <pre
        id="pytch-hidden-stdout"
        className="d-none"
        data-captured-stdout=""
      />
    </main>
  );
};
