import React from "react";
import { useStoreState, useStoreActions } from "../store";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { SyncState } from "../model/project";
import Tutorial from "./Tutorial";
import ErrorReportList from "./ErrorReportList";
import Assets from "./ProjectAssetList";

const StandardOutput = () => {
  const text = useStoreState((state) => state.standardOutputPane.text);

  const inner =
    text === "" ? (
      <p className="placeholder">
        Anything your program prints will appear here.
      </p>
    ) : (
      <pre className="SkulptStdout">{text}</pre>
    );

  return <div className="StandardOutputPane">{inner}</div>;
};

const Errors = () => {
  const errorList = useStoreState((state) => state.errorReportList.errors);
  const inner =
    errorList.length === 0 ? (
      <p className="placeholder">
        Any errors your project encounters will appear here.
      </p>
    ) : (
      <ErrorReportList />
    );
  return <div className="ErrorsPane">{inner}</div>;
};

const InfoPanel = () => {
  const isSyncingFromBackEnd = useStoreState(
    (state) => state.activeProject.syncState === SyncState.SyncingFromBackEnd
  );
  const isTrackingTutorial = useStoreState(
    (state) => state.activeProject.project?.trackedTutorial != null
  );
  const activeKey = useStoreState((state) => state.infoPanel.activeTabKey);
  const setActiveKey = useStoreActions(
    (state) => state.infoPanel.setActiveTabKey
  );

  if (isSyncingFromBackEnd) {
    return null;
  }

  return (
    <Tabs
      className="InfoPanel"
      transition={false}
      activeKey={activeKey}
      onSelect={(k) => setActiveKey(k as string)}
    >
      {isTrackingTutorial && (
        <Tab className="InfoPane" eventKey="tutorial" title="Tutorial">
          <Tutorial />
        </Tab>
      )}
      <Tab className="InfoPane" eventKey="assets" title="Images and sounds">
        <Assets />
      </Tab>
      <Tab className="InfoPane" eventKey="output" title="Output">
        <StandardOutput />
      </Tab>
      <Tab className="InfoPane" eventKey="errors" title="Errors">
        <Errors />
      </Tab>
    </Tabs>
  );
};

export default InfoPanel;
