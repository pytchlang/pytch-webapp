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
import { FlatModals } from "./FlatModals";
import { useFocusContext } from "./hooks/focus-steering";
import { NotableChangeToasts } from "./NotableChangeToasts";

const Modals: React.FC<EmptyProps> = () => {
  const programKind = useStoreState(
    (state) => state.activeProject.project.program.kind
  );
  switch (programKind) {
    case "flat":
      return <FlatModals />;
    case "per-method":
      return <PerMethodModals />;
    default:
      return assertNever(programKind);
  }
};

export const IDELayout: React.FC<EmptyProps> = () => {
  const focusContext = useFocusContext();
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

  // Even though we refer to activityContentFullStateLabel, we only want
  // to set the bookmark on initial render; hence empty deps array.
  useEffect(() => {
    const defaultBookmark = (() => {
      switch (activityContentFullStateLabel) {
        case "collapsed":
        case "expanded-helpsidebar":
          return 0;
        case "expanded-specimen":
        case "expanded-lesson":
        case "expanded-tutorial":
          return 1;
        default:
          return assertNever(activityContentFullStateLabel);
      }
    })();

    focusContext.bookmarkItemByKeyAndIndex("ActivityBar", defaultBookmark);
  }, []);

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
    const keyOutcome = focusContext.onKeyDown(evt.key, now);
    if (keyOutcome === "triggered-action") {
      evt.preventDefault();
    }
  };

  return (
    <DivSettingWindowTitle
      className={classes}
      windowTitle={`Pytch: ${projectName}`}
      data-project-id={projectId}
    >
      <Modals />
      <NotableChangeToasts />
      <main tabIndex={-1} onKeyDown={mainOnKeyDown}>
        <ActivityPane />
        <EditorAndOutErr />
        <StageAndActorsOrAssets />
      </main>
    </DivSettingWindowTitle>
  );
};
