import React, { useState } from "react";
import { Lorem } from "./Lorem";
import { Tabs, TabWithTypedKey } from "../TabWithTypedKey";

export const InfoPanel = () => {
  type TabKey = "output" | "errors";
  const [activeTab, setActiveTab] = useState<TabKey>("output");

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
          <h2>Output tab</h2>
          <Lorem />
        </Tab>
        <Tab eventKey="errors" title="Errors">
          <h2>Errors tab</h2>
          <Lorem />
        </Tab>
      </Tabs>
    </div>
  );
};
