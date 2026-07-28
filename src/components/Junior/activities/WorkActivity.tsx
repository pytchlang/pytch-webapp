import React, {useState} from "react";
import {assertNever, EmptyProps} from "../../../utils";
import {Spinner, Tab} from "react-bootstrap";
import {Content} from "../../../model/keyboard-shortcuts-help";
import {useStoreState} from "../../../store";

import "../KeyNavHelpSidebar.scss";
import "./Activity.scss";
import {useActorNubs, useHelpHatBlockDrop, useJrEditActions, useJrEditState,} from "../hooks";
import {LayoutStyle} from "../../../model/ui";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Tabs} from "../../TabWithTypedKey";
import {CodeEditor} from "../../CodeEditor";
import {ProjectAssetList} from "../../ProjectAssetList";
import {ActorCard} from "../ActorsList";
import {FocusGroupContainer} from "../../FocusGroupContainer";
import {AddSomethingSingleButton} from "../AddSomethingButton";
import {ActorOps} from "../../../model/junior/structured-program";
import {useFocusContext} from "../../hooks/focus-steering";
import {AppearancesList} from "../AppearancesList";
import {ScriptsEditor} from "../CodeEditor";
import classNames from "classnames";
import {SoundsList} from "../SoundsList";
import {useTranslation} from "react-i18next";

export type WorkActivityTabKey = "sprites" | "code" | "appearances" | "sounds";

const CodeSubActivity = () => {

  const programKind = useStoreState(
    (state) => state.activeProject.project.program.kind
  );

  const actorId = useJrEditState((s) => s.activeActor);
  const [dropProps, dropRef] = useHelpHatBlockDrop(actorId);

  const classes = classNames("Junior-CodeEditor w-100 h-100", dropProps);

  switch (programKind) {
    case "flat":
      return <CodeEditor />;
    case "per-method":
      return (
        <>
          <div className="d-flex h-100 w-100">
            <div ref={dropRef} className={classes}>
              <ScriptsEditor />
            </div>
          </div>
        </>
      );
    default:
      return assertNever(programKind);
  }
};

const AppearancesSubActivity = () => {
  return <AppearancesList />;
};

const SoundsSubActivity = () => {
  return <SoundsList />;
};

const SpritesSubActivity = () => {
  const programKind = useStoreState(
    (state) => state.activeProject.project.program.kind
  );

  const focusContext = useFocusContext("per-method");
  const actorNubs = useActorNubs();
  const activeActor = useJrEditState((s) => s.activeActor);
  const runUpsertFlow = useJrEditActions((a) => a.upsertSpriteFlow.run);
  const existingNames = ActorOps.spriteNames(actorNubs);

  const launchAddSpriteModal = () => {
    runUpsertFlow({
      upsertionAction: { kind: "insert" },
      existingNames,
      onDispose: focusContext.onDisposeAddSprite(),
    });
  };

  const { t } = useTranslation("ide");

  switch (programKind) {
    case "flat":
      return <ProjectAssetList />;
    case "per-method":
      return (
        <>
          <div className="d-flex h-100 w-100">
            <FocusGroupContainer
              className="gfs__actors__container w-100"
              groupedFocusKey="ActorsList"
            >
              <ol className="ActorsList">
                {actorNubs.map((a) => (
                  <li key={a.id} className="Item-ActorCard">
                    <ActorCard
                      isActive={a.id === activeActor}
                      kind={a.kind}
                      id={a.id}
                      name={a.name}
                    />
                  </li>
                ))}
              </ol>
              <AddSomethingSingleButton
                what="sprite"
                label={t("actor-action.add")}
                onClick={launchAddSpriteModal}
              />
            </FocusGroupContainer>
          </div>
        </>
      );
    default:
      return assertNever(programKind);
  }
};

const WorkActivityContent: React.FC<{ content: Content }> = () => {
  const layoutStyle: LayoutStyle = useStoreState(
    (state) => state.ideLayout.layoutStyle
  );
  const wrapperClasses =
    layoutStyle === "single-screen-vertical"
      ? "d-flex flex-row"
      : "d-flex flex-column";

  const [activeTab, setActiveTab] = useState<WorkActivityTabKey>("sprites");
  const { t } = useTranslation("ide");

  return (
    <section className="info-pane">
      <div className={wrapperClasses + " h-100 activity-submenu"}>
        <Tabs
          transition={false}
          activeKey={activeTab}
          onSelect={(k) => k && setActiveTab(k as WorkActivityTabKey)}
          aria-label={t("activity-pane.work-activity.aria-label")}
        >
          <Tab
            eventKey="sprites"
            title={
              <>
                <div className={"icon-wrapper"}>
                  <FontAwesomeIcon icon={"object-group"} className={""} />
                </div>
                <p>{t("activity-pane.work-activity.sprites")}</p>
              </>
            }
          >
            <SpritesSubActivity />
          </Tab>
          <Tab
            eventKey="code"
            title={
              <>
                <div className={"icon-wrapper"}>
                  <FontAwesomeIcon icon={"code"} className={""} />
                </div>
                <p>{t("activity-pane.work-activity.code")}</p>
              </>
            }
          >
            <CodeSubActivity />
          </Tab>
          <Tab
            eventKey="appearances"
            title={
              <>
                <div className={"icon-wrapper"}>
                  <FontAwesomeIcon icon={"brush"} className={""} />
                </div>
                <p>{t("activity-pane.work-activity.appearances")}</p>
              </>
            }
          >
            <AppearancesSubActivity />
          </Tab>
          <Tab
            eventKey="sounds"
            title={
              <>
                <div className={"icon-wrapper"}>
                  <FontAwesomeIcon icon={"volume-high"} className={""} />
                </div>
                <p>{t("activity-pane.work-activity.sounds")}</p>
              </>
            }
          >
            <SoundsSubActivity />
          </Tab>
        </Tabs>
      </div>
    </section>
  );
};

export const WorkActivity: React.FC<EmptyProps> = () => {
  return (
    <div className="WorkActivity gfs__help-content h-100" tabIndex={-1}>
      <WorkActivityContent />
    </div>
  );
};
