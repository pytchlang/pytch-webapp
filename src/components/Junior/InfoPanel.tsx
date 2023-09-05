import React, { useState } from "react";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { Lorem } from "./Lorem";

export const InfoPanel = () => {
  const [activeTab, setActiveTab] = useState("output");

  return (
    <div className="Junior-InfoPanel-container">
      <Tabs
        className="Junior-InfoPanel"
        transition={false}
        activeKey={activeTab}
        onSelect={(k) => k && setActiveTab(k)}
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
