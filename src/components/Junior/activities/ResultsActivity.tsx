import React, {useState} from "react";
import {EmptyProps} from "../../../utils";
import {Tab} from "react-bootstrap";
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

const ResultsActivityContent: React.FC<{ }> = () => {
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
          aria-label={t("activity-pane.results-activity.aria-label" as string)}
        >
          <Tab
            eventKey="project"
            title={
              <>
                <div className={"icon-wrapper"}>
                  <FontAwesomeIcon icon={"flag"} className={""} />
                </div>
                <p>{t("activity-pane.results-activity.project")}</p>
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
                <p>{t("activity-pane.results-activity.output")}</p>
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
                <p>{t("activity-pane.results-activity.errors")}</p>
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

export const ResultsActivity: React.FC<EmptyProps> = () => {

  return (
    <div className="ResultsActivity gfs__help-content h-100" tabIndex={-1}>
      <ResultsActivityContent />
    </div>
  );
};
