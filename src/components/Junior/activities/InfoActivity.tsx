import React, { useState } from "react";
import { assertNever, EmptyProps } from "../../../utils";
import {
  Spinner,
  Tab,
} from "react-bootstrap";
import { Content } from "../../../model/keyboard-shortcuts-help";
import { useStoreState } from "../../../store";
import { useActionAsEffect } from "../../hooks/use-action-as-effect";

import "../KeyNavHelpSidebar.scss";
import "./Activity.scss";
import "../IDEOverview.scss";
import { LayoutStyle } from "../../../model/ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tabs } from "../../TabWithTypedKey";
import { IDEOverview } from "../IDEOverview";
import { KeyNavHelpSidebar } from "../KeyNavHelpSidebar";
import { HelpSidebar } from "../../HelpSidebar";
import { useTranslation } from "react-i18next";

export type InfoActivityTabKey = "overview" | "keynavhelp" | "helpsidebar";

const OverviewSubActivity = () => {
  return <IDEOverview />;
};

const KeyNavHelpSubActivity = () => {
  return <KeyNavHelpSidebar />;
};

const HelpSubActivity = () => {
  return <HelpSidebar />;
};

const InfoActivityContent: React.FC<{ content: Content }> = () => {
  const layoutStyle: LayoutStyle = useStoreState(
    (state) => state.ideLayout.layoutStyle
  );
  const wrapperClasses =
    layoutStyle === "single-screen-vertical"
      ? "d-flex flex-row"
      : "d-flex flex-column";
  const [activeTab, setActiveTab] = useState<InfoActivityTabKey>("overview");
  const { t } = useTranslation("ide");

  return (
    <section className="info-pane">
      <div className={wrapperClasses + " h-100 activity-submenu"}>
        <Tabs
          transition={false}
          activeKey={activeTab}
          onSelect={(k) => k && setActiveTab(k as InfoActivityTabKey)}
          aria-label={t("activity-pane.info-activity.topics.aria-label")}
          tabIndex={-1}
        >
          <Tab
            eventKey="overview"
            title={
              <>
                <div className={"icon-wrapper"}>
                  <FontAwesomeIcon icon={"grid-horizontal"} className={""} />
                </div>
                <p>UI Overview</p>
              </>
            }
          >
            <OverviewSubActivity />
          </Tab>
          <Tab
            eventKey="helpsidebar"
            title={
              <>
                <div className={"icon-wrapper"}>
                  <FontAwesomeIcon icon={"code"} className={""} />
                </div>
                <p>Code References</p>
              </>
            }
          >
            <HelpSubActivity />
          </Tab>
          <Tab
            eventKey="keynavhelp"
            title={
              <>
                <div className={"icon-wrapper"}>
                  <FontAwesomeIcon icon={"keyboard"} className={""} />
                </div>
                <p>Keyboard Shortcuts</p>
              </>
            }
          >
            <KeyNavHelpSubActivity />
          </Tab>
        </Tabs>
      </div>
    </section>
  );
};

const InfoActivityMaybeContent: React.FC<EmptyProps> = () => {
  const contentState = useStoreState(
    (s) => s.ideLayout.keyboardShortcutsHelpContent
  );
  switch (contentState.contentFetchState.state) {
    case "idle":
    case "requesting":
      return (
        <div className="spinner-container h-100 w-100 d-flex justify-content-center align-items-center">
          <Spinner animation="border" />
        </div>
      );
    case "available":
      return (
        <InfoActivityContent content={contentState.contentFetchState.content} />
      );
    case "error":
      return (
        <>
          <h2>Problem</h2>
          <p>Sorry, there was a problem fetching the help information.</p>
        </>
      );
    default:
      return assertNever(contentState.contentFetchState);
  }
};

export const InfoActivity: React.FC<EmptyProps> = () => {
  useActionAsEffect(
    (actions) => actions.ideLayout.keyboardShortcutsHelpContent.maybeLoadContent
  );

  return (
    <div className="InfoActivity gfs__help-content h-100" tabIndex={-1}>
      <InfoActivityMaybeContent />
    </div>
  );
};
