import React, { KeyboardEventHandler, useEffect } from "react";
import classNames from "classnames";
import { useStoreActions, useStoreState } from "../store";
import { useJrEditState } from "./Junior/hooks";
import { assertNever, EmptyProps } from "../utils";
import { DivSettingWindowTitle } from "./DivSettingWindowTitle";
import { ActivityPane } from "./Junior/ActivityPane";
import { EditorAndOutErr } from "./EditorAndOutErr";
import { StageAndActorsOrAssets } from "./StageAndActorsOrAssets";
import { FullScreenLayout } from "./FullScreenLayout";
import { Modals as PerMethodModals } from "./Junior/Modals";
import { globalFocusSteering } from "../model/junior/global-steer-focus";

const Modals: React.FC<EmptyProps> = () => {
  const programKind = useStoreState(
    (state) => state.activeProject.project.program.kind
  );
  switch (programKind) {
    case "flat":
      // TODO: Move the "flat" modals here?
      return false;
    case "per-method":
      return <PerMethodModals />;
    default:
      return assertNever(programKind);
  }
};

export const IDELayout: React.FC<EmptyProps> = () => {
  const projectId = useStoreState((state) => state.activeProject.project.id);
  const projectName = useStoreState(
    (state) => state.activeProject.project.name
  );
  const activityContentFullStateLabel = useJrEditState(
    (s) => s.activityContentFullStateLabel
  );
  const isFullScreen = useStoreState(
    (state) => state.ideLayout.fullScreenState.isFullScreen
  );
  const maybeConnectToLiveReloadServer = useStoreActions(
    (actions) => actions.reloadServer.maybeConnect
  );

  useEffect(() => maybeConnectToLiveReloadServer());

  if (isFullScreen) {
    return <FullScreenLayout />;
  }

  const classes = classNames(
    "IDELayout",
    "abs-0000",
    `activity-content-${activityContentFullStateLabel}`
  );

  const mainOnKeyDown: KeyboardEventHandler = (evt) => {
    const tgtElt = evt.target as HTMLElement;
    const tgtTag = tgtElt.tagName ?? "--UNKNOWN--";

    switch (tgtTag) {
      case "TEXTAREA":
      case "INPUT":
        return;
    }

    // Any way to not couple this so tightly?
    if (tgtElt.id === "pytch-speech-bubbles") {
      return;
    }

    const now = Date.now() / 1000.0; // In units of seconds
    globalFocusSteering.onKeyDown(evt.key, now);
  };

  return (
    <DivSettingWindowTitle
      className={classes}
      windowTitle={`Pytch: ${projectName}`}
      data-project-id={projectId}
    >
      <Modals />
      <main tabIndex={-1} onKeyDown={mainOnKeyDown}>
        <ActivityPane />
        <EditorAndOutErr />
        <StageAndActorsOrAssets />
      </main>
    </DivSettingWindowTitle>
  );
};
