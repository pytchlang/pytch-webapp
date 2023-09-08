import React, { useState } from "react";

import { Tabs, TabWithTypedKey } from "../TabWithTypedKey";

import { CodeEditor } from "./CodeEditor";
import { AppearancesList } from "./AppearancesList";
import { SoundsList } from "./SoundsList";

import {
  ActorKindOps,
  StructuredProgramOps,
} from "../../model/junior/structured-program";
import { useJrEditState, useStructuredProgram } from "./hooks";

export const ActorProperties = () => {
  type TabKey = "code" | "appearances" | "sounds";
  const [activeTab, setActiveTab] = useState<TabKey>("code");

  const focusedActorId = useJrEditState((s) => s.focusedActor);

  // TODO: This approach makes things slow because every edit to any
  // script changes the program which causes a re-render of this whole
  // component tree.
  //
  // Maybe add a (denormalised) state.jrEditState.focusedActorKind slot?

  const program = useStructuredProgram();

  const focusedActor = StructuredProgramOps.uniqueActorById(
    program,
    focusedActorId
  );

  const actorKind = focusedActor.kind;
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
