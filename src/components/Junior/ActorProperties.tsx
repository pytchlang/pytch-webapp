import React, { useState } from "react";

import { Tabs, TabWithTypedKey } from "../TabWithTypedKey";

import { CodeEditor } from "./CodeEditor";
import { AppearancesList } from "./AppearancesList";
import { SoundsList } from "./SoundsList";

import {
  ActorKindOps,
  StructuredProgramOps,
} from "../../model/junior/structured-program";
import { useJrEditState, useMappedProgram } from "./hooks";

export const ActorProperties = () => {
  type TabKey = "code" | "appearances" | "sounds";
  const [activeTab, setActiveTab] = useState<TabKey>("code");

  const focusedActorId = useJrEditState((s) => s.focusedActor);

  const actorKind = useMappedProgram(
    "<ActorProperties>",
    (program) =>
      StructuredProgramOps.uniqueActorById(program, focusedActorId).kind
  );

  const appearancesTitle =
    ActorKindOps.names(actorKind).appearancesDisplayTitle;

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
        <Tab eventKey="appearances" title={appearancesTitle}>
          <AppearancesList />
        </Tab>
        <Tab eventKey="sounds" title="Sounds">
          <SoundsList />
        </Tab>
      </Tabs>
    </div>
  );
};
