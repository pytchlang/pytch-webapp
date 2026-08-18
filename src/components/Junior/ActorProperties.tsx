import React from "react";
import { useTranslation } from "react-i18next";

import { ActorPropertiesTabKey as TabKey } from "../../model/junior/edit-state";
import { Tabs, TabWithTypedKey } from "../TabWithTypedKey";

import { CodeEditor } from "./CodeEditor";
import { AppearancesList } from "./AppearancesList";
import { SoundsList } from "./SoundsList";

import Spinner from "react-bootstrap/Spinner";
import classNames from "classnames";

import { StructuredProgramOps } from "../../model/junior/structured-program";
import { useJrEditActions, useJrEditState, useMappedProgram } from "./hooks";
import { AppearancesTabTitle } from "./AppearancesTabTitle";

export const ActorProperties = () => {
  const { t } = useTranslation("ide");
  const activeTab = useJrEditState((s) => s.actorPropertiesActiveTab);
  const setActiveTab = useJrEditActions((a) => a.setActorPropertiesActiveTab);
  const activeActorId = useJrEditState((s) => s.activeActor);
  const actionInProgress = useJrEditState((s) => s.assetReorderInProgress);

  const actorKind = useMappedProgram(
    "<ActorProperties>",
    (program) =>
      StructuredProgramOps.uniqueActorById(program, activeActorId).kind
  );

  const appearancesTitle = (
    <AppearancesTabTitle actorKind={actorKind}></AppearancesTabTitle>
  );

  const ariaLabel = t(`per-method.pane-label.actor-properties.${actorKind}`);

  const Tab = TabWithTypedKey<TabKey>;
  return (
    <section
      className="Junior-ActorProperties-container compact-tablist-container"
      aria-label={ariaLabel}
    >
      <Tabs
        transition={false}
        activeKey={activeTab}
        onSelect={(k) => k && setActiveTab(k as TabKey)}
      >
        <Tab
          eventKey="code"
          title={t("per-method.tab-title.actor-properties.code")}
        >
          <CodeEditor />
        </Tab>
        <Tab eventKey="appearances" title={appearancesTitle}>
          <AppearancesList />
        </Tab>
        <Tab
          eventKey="sounds"
          title={t("per-method.tab-title.actor-properties.sounds")}
        >
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
    </section>
  );
};
