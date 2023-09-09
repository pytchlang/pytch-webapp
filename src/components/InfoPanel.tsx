import React from "react";
import { useStoreState, useStoreActions } from "../store";
import { Tabs, TabWithTypedKey } from "./TabWithTypedKey";
import Tutorial from "./Tutorial";
import { ErrorReportList } from "./ErrorReportList";
import ProjectAssetList from "./ProjectAssetList";
import EditorWebSocketInfo from "./EditorWebSocketInfo";
import { LayoutChooser } from "./LayoutChooser";
import { isEnabled as liveReloadEnabled } from "../model/live-reload";
import { InfoPanelTabKey } from "../model/ui";

const StandardOutput = () => {
  const text = useStoreState((state) => state.standardOutputPane.text);

  const maybePlaceholder =
    text === "" ? (
      <p className="info-pane-placeholder">
        Anything your program prints will appear here.
      </p>
    ) : null;

  return (
    <div className="StandardOutputPane">
      {maybePlaceholder}
      <pre className="SkulptStdout">{text}</pre>
    </div>
  );
};

const Errors = () => {
  const errorList = useStoreState((state) => state.errorReportList.errors);
  const inner =
    errorList.length === 0 ? (
      <p className="info-pane-placeholder">
        Any errors your project encounters will appear here.
      </p>
    ) : (
      <ErrorReportList />
    );
  return <div className="ErrorsPane">{inner}</div>;
};

const InfoPanel = () => {
  const isSyncingFromBackEnd = useStoreState(
    (state) => state.activeProject.syncState.loadState === "pending"
  );
  const isTrackingTutorial = useStoreState(
    (state) => state.activeProject.project?.trackedTutorial != null
  );
  const activeKey = useStoreState((state) => state.infoPanel.activeTabKey);
  const setActiveKey = useStoreActions(
    (state) => state.infoPanel.setActiveTabKey
  );
  const layoutKind = useStoreState((state) => state.ideLayout.kind);

  if (isSyncingFromBackEnd) {
    return null;
  }

  const Tab = TabWithTypedKey<InfoPanelTabKey>;
  return (
    <div className="InfoPanel-container">
      <LayoutChooser />
      <Tabs
        className={`InfoPanel ${layoutKind}`}
        transition={false}
        activeKey={activeKey}
        onSelect={(k) => setActiveKey(k as InfoPanelTabKey)}
      >
        {isTrackingTutorial && (
          <Tab className="InfoPane" eventKey="tutorial" title="Tutorial">
            <Tutorial />
          </Tab>
        )}
        <Tab className="InfoPane" eventKey="assets" title="Images and sounds">
          <ProjectAssetList />
        </Tab>
        <Tab className="InfoPane" eventKey="output" title="Output">
          <StandardOutput />
        </Tab>
        <Tab className="InfoPane" eventKey="errors" title="Errors">
          <Errors />
        </Tab>
        {liveReloadEnabled ? (
          <Tab
            className="InfoPane"
            eventKey="websocket-log"
            title="Editor WebSocket"
          >
            <EditorWebSocketInfo />
          </Tab>
        ) : null}
      </Tabs>
    </div>
  );
};

export default InfoPanel;
