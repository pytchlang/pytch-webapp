import React, { useState } from "react";

import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";

import { CodeEditor } from "./CodeEditor";
import { AppearancesList } from "./AppearancesList";
import { SoundsList } from "./SoundsList";

export const ActorProperties = () => {
  const [activeTab, setActiveTab] = useState("code");
  return (
    <div className="Junior-ActorProperties-container">
      <Tabs
        transition={false}
        activeKey={activeTab}
        onSelect={(k) => k && setActiveTab(k)}
      >
        <Tab eventKey="code" title="Code">
          <CodeEditor />
        </Tab>
        <Tab eventKey="appearances" title="APPEARANCES">
          <AppearancesList />
        </Tab>
        <Tab eventKey="sounds" title="Sounds">
          <SoundsList />
        </Tab>
      </Tabs>
    </div>
  );
};
