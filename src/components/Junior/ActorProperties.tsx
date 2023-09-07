import React, { useState } from "react";

import { Tabs, TabWithTypedKey } from "../TabWithTypedKey";

import { CodeEditor } from "./CodeEditor";
import { AppearancesList } from "./AppearancesList";
import { SoundsList } from "./SoundsList";

export const ActorProperties = () => {
  type TabKey = "code" | "appearances" | "sounds";
  const [activeTab, setActiveTab] = useState<TabKey>("code");

  const Tab = TabWithTypedKey<TabKey>;
  return (
    <div className="Junior-ActorProperties-container">
      <Tabs
        transition={false}
        activeKey={activeTab}
        onSelect={(k) => k && setActiveTab(k as TabKey)}
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
