import React, { KeyboardEventHandler, useEffect } from "react";
import classNames from "classnames";
import { useStoreState } from "../store";
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
import { useActionAsEffect } from "./hooks/use-action-as-effect";
import { IDESkipLinks } from "./IDESkipLinks";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("ide");
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

  useActionAsEffect((actions) => actions.reloadServer.maybeConnect);

  useEffect(
    () => {
      // Reset browser's internal idea of trying to preserve the
      // position in the tab order on a rearrangement of the DOM.

      const body = document.body;
      body.setAttribute("tabindex", "-1");
      body.focus();
      body.removeAttribute("tabindex");
    },

    // Only force focus on first render:
    []
  );

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
      <IDESkipLinks />
      <Modals />
      <NotableChangeToasts />
      <main
        aria-label={t("main.aria-label")}
        tabIndex={-1}
        onKeyDown={mainOnKeyDown}
      >
        <ActivityPane />
        <EditorAndOutErr />
        <StageAndActorsOrAssets />
      </main>
    </DivSettingWindowTitle>
  );
};
