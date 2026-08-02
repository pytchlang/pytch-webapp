import React, {useState} from "react";
import {assertNever, EmptyProps} from "../../../utils";
import {Spinner, Tab} from "react-bootstrap";
import {Content} from "../../../model/keyboard-shortcuts-help";
import {useStoreState} from "../../../store";

import "../KeyNavHelpSidebar.scss";
import "./Activity.scss";
import {LayoutStyle} from "../../../model/ui";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Tabs} from "../../TabWithTypedKey";
import {Errors, StandardOutput} from "../InfoPanel";
import {StageWithControls} from "../../StageWithControls";
import {useTranslation} from "react-i18next";

export type ResultsActivityTabKey = "output" | "errors" | "project";

const OutputSubActivity = () => {
  return <StandardOutput />;
};

const ErrorsSubActivity = () => {
  return <Errors />;
};

const ProjectsSubActivity = () => {
  return <StageWithControls />;
};

const ResultsActivityContent: React.FC<{ content: Content }> = () => {
  const layoutStyle: LayoutStyle = useStoreState(
    (state) => state.ideLayout.layoutStyle
  );
  const wrapperClasses =
    layoutStyle === "single-screen-vertical"
      ? "d-flex flex-row"
      : "d-flex flex-column";

  const [activeTab, setActiveTab] = useState<ResultsActivityTabKey>("project");
  const { t } = useTranslation("ide");

  return (
    <section className="info-pane">
      <div className={wrapperClasses + " h-100 activity-submenu"}>
        <Tabs
          transition={false}
          activeKey={activeTab}
          onSelect={(k) => k && setActiveTab(k as ResultsActivityTabKey)}
          aria-label={t("activity-pane.results-activity.aria-label")}
        >
          <Tab
            eventKey="project"
            title={
              <>
                <div className={"icon-wrapper"}>
                  <FontAwesomeIcon icon={"flag"} className={""} />
                </div>
                <p>Project</p>
              </>
            }
          >
            <ProjectsSubActivity />
          </Tab>
          <Tab
            eventKey="output"
            title={
              <>
                <div className={"icon-wrapper"}>
                  <FontAwesomeIcon icon={"info-circle"} className={""} />
                </div>
                <p>Output</p>
              </>
            }
          >
            <OutputSubActivity />
          </Tab>
          <Tab
            eventKey="errors"
            title={
              <>
                <div className={"icon-wrapper"}>
                  <FontAwesomeIcon icon={"bug"} className={""} />
                </div>
                <p>Errors</p>
              </>
            }
          >
            <ErrorsSubActivity />
          </Tab>
        </Tabs>
      </div>
    </section>
  );
};

const ResultsActivityMaybeContent: React.FC<EmptyProps> = () => {
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
        <ResultsActivityContent
          content={contentState.contentFetchState.content}
        />
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

export const ResultsActivity: React.FC<EmptyProps> = () => {

  return (
    <div className="ResultsActivity gfs__help-content h-100" tabIndex={-1}>
      <ResultsActivityMaybeContent />
    </div>
  );
};
