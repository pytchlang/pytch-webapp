import React, {KeyboardEventHandler, useEffect} from "react";
import classNames from "classnames";
import {useStoreState} from "../store";
import {useJrEditState} from "./Junior/hooks";
import {assertNever, EmptyProps} from "../utils";
import {FullScreenLayout} from "./layouts/FullScreenLayout";
import {Modals as PerMethodModals} from "./Junior/Modals";
import {FlatModals} from "./FlatModals";
import {useFocusContext} from "./hooks/focus-steering";
import {useActionAsEffect} from "./hooks/use-action-as-effect";
import {SplitScreenLayout} from "./layouts/SplitScreenLayout";
import {SingleScreenVerticalLayout} from "./layouts/SingleScreenVerticalLayout";

export const Modals: React.FC<EmptyProps> = () => {
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
  const focusContext = useFocusContext("per-method");

  const activityContentFullStateLabel = useJrEditState(
    (s) => s.activityContentFullStateLabel
  );
  const isFullScreen = useStoreState(
    (state) => state.ideLayout.fullScreenState.isFullScreen
  );
  const layoutStyle = useStoreState((state) => state.ideLayout.layoutStyle);

  useActionAsEffect((actions) => actions.reloadServer.maybeConnect);

  // Even though we refer to activityContentFullStateLabel, we only want
  // to set the bookmark on initial render; hence omitting
  // activityContentFullStateLabel from deps array.
  useEffect(
    () => {
      // TODO: The facts about which activities are present and which one
      // is active when booted are spread across the code.  Here, and in
      // (junior) `EditState.bootForProgram()`.  Would be good to tidy
      // this up somehow.
      const defaultBookmark = (() => {
        switch (activityContentFullStateLabel) {
          case "collapsed":
          case "expanded-work":
          case "expanded-results":
            return 0;
          case "expanded-specimen":
          case "expanded-lesson":
          case "expanded-tutorial":
          case "expanded-demo":
          case "expanded-settings":
          case "expanded-info":
            return 1;
          // case "expanded-keynavhelp":
          // case "expanded-i18n":
          //   console.warn(
          //     "should not have expanded-(keynavhelp|i18n) on first render"
          //   );
          // But return something non-erroneous anyway.
          // return 0;
          default:
            return assertNever(activityContentFullStateLabel);
        }
      })();

      focusContext.bookmarkItemByKeyAndIndex("ActivityBar", defaultBookmark);
    },
    // eslint-disable-next-line @eslint-react/exhaustive-deps
    [focusContext]
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

  switch (layoutStyle) {
    case "split-screen":
      return (
        <SplitScreenLayout
            classes = { classes }
            mainOnKeyDown = { mainOnKeyDown }
        />
      );
    case "single-screen-vertical":
      return (
        <SingleScreenVerticalLayout
          classes = { classes }
          mainOnKeyDown = { mainOnKeyDown }
        />
      );
  }
};
