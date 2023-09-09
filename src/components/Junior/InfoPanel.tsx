import React from "react";
import { useStoreState } from "../../store";
import { Lorem } from "./Lorem";
import { useJrEditActions, useJrEditState } from "./hooks";
import { InfoPanelTabKey as TabKey } from "../../model/junior/edit-state";
import { Tabs, TabWithTypedKey } from "../TabWithTypedKey";

const StandardOutput = () => {
  // TODO: Remove duplication between this and non-jr component.
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

export const InfoPanel = () => {
  const activeTab = useJrEditState((s) => s.infoPanelActiveTab);
  const setActiveTab = useJrEditActions((a) => a.setInfoPanelActiveTab);

  const Tab = TabWithTypedKey<TabKey>;
  return (
    <div className="Junior-InfoPanel-container">
      <Tabs
        className="Junior-InfoPanel"
        transition={false}
        activeKey={activeTab}
        onSelect={(k) => k && setActiveTab(k as TabKey)}
      >
        <Tab eventKey="output" title="Output">
          <StandardOutput />
        </Tab>
        <Tab eventKey="errors" title="Errors">
          <h2>Errors tab</h2>
          <Lorem />
        </Tab>
      </Tabs>
    </div>
  );
};
