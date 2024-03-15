import React, { useEffect } from "react";
import NavBanner from "./NavBanner";
import { useStoreActions, useStoreState } from "../store";
import { SyncState } from "../model/project";
import { TutorialSummaryDisplay } from "./TutorialSummaryDisplay";
import { EmptyProps } from "../utils";
import { PytchProgramKind } from "../model/pytch-program";

const LoadingTutorialsPlaceholder = () => {
  const syncState = useStoreState(
    (state) => state.tutorialCollection.syncState
  );

  if (syncState === SyncState.Syncd) return null;

  return (
    <div className="loading-placeholder">
      <p>Loading...</p>
    </div>
  );
};

const TutorialList: React.FC<EmptyProps> = () => {
  const loadSummaries = useStoreActions(
    (actions) => actions.tutorialCollection.loadSummaries
  );
  const syncState = useStoreState(
    (state) => state.tutorialCollection.syncState
  );
  const available = useStoreState(
    (state) => state.tutorialCollection.available
  );
  const activeUiVersion = useStoreState(
    (state) => state.versionOptIn.activeUiVersion
  );

  useEffect(() => {
    document.title = "Pytch: Tutorials";
    if (syncState === SyncState.SyncNotStarted) {
      loadSummaries();
    }
  });

  const visibleTutorials = available.filter((tutorial) => {
    const programKind: PytchProgramKind =
      tutorial.metadata.programKind ?? "flat";
    return activeUiVersion === "v2" || programKind === "flat";
  });

  const paneRef: React.RefObject<HTMLDivElement> = React.createRef();
  useEffect(() => {
    paneRef.current?.focus();
  });

  return (
    <>
      <NavBanner />
      <div className="TutorialList" tabIndex={-1} ref={paneRef}>
        <h1>Tutorials</h1>
        <LoadingTutorialsPlaceholder />
        <ul className="tutorial-list">
          {visibleTutorials.map((t) => (
            <TutorialSummaryDisplay
              key={t.slug}
              tutorial={t}
              kind="tutorial-demo-and-share"
            />
          ))}
        </ul>
      </div>
    </>
  );
};

export default TutorialList;
