import React, { useEffect } from "react";
import NavBanner from "./NavBanner";
import { useStoreActions, useStoreState } from "../store";
import { SyncState } from "../model/project";
import { TutorialSummaryDisplay } from "./TutorialSummaryDisplay";

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

const TutorialList: React.FC<RouteComponentProps> = (props) => {
  const loadSummaries = useStoreActions(
    (actions) => actions.tutorialCollection.loadSummaries
  );
  const syncState = useStoreState(
    (state) => state.tutorialCollection.syncState
  );
  const available = useStoreState(
    (state) => state.tutorialCollection.available
  );

  useEffect(() => {
    document.title = "Pytch: Tutorials";
    if (syncState === SyncState.SyncNotStarted) {
      loadSummaries();
    }
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
          {available.map((t) => (
            <TutorialSummaryDisplay key={t.slug} tutorial={t} />
          ))}
        </ul>
      </div>
    </>
  );
};

export default TutorialList;
