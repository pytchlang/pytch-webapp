import React from "react";

import { ActorPropertiesTabKey as TabKey } from "../../model/junior/edit-state";
import { Tabs, TabWithTypedKey } from "../TabWithTypedKey";

import { CodeEditor } from "./CodeEditor";
import { AppearancesList } from "./AppearancesList";
import { SoundsList } from "./SoundsList";

import { Spinner } from "react-bootstrap";
import classNames from "classnames";

import {
  ActorKindOps,
  StructuredProgramOps,
} from "../../model/junior/structured-program";
import { useJrEditActions, useJrEditState, useMappedProgram } from "./hooks";
import { AppearancesTabTitle } from "./AppearancesTabTitle";

export const ActorProperties = () => {
  const activeTab = useJrEditState((s) => s.actorPropertiesActiveTab);
  const setActiveTab = useJrEditActions((a) => a.setActorPropertiesActiveTab);

  const focusedActorId = useJrEditState((s) => s.focusedActor);
  const actionInProgress = useJrEditState((s) => s.assetReorderInProgress);

  const actorKind = useMappedProgram(
    "<ActorProperties>",
    (program) =>
      StructuredProgramOps.uniqueActorById(program, focusedActorId).kind
  );

  const appearancesTitleText =
    ActorKindOps.names(actorKind).appearancesDisplayTitle;
  const appearancesTitle = (
    <AppearancesTabTitle value={appearancesTitleText}></AppearancesTabTitle>
  );

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
      <div
        className={classNames("busy-overlay", "abs-0000", {
          actionInProgress,
        })}
      >
        <div className="spinner-container">
          <Spinner animation="border" />
        </div>
      </div>
    </div>
  );
};
