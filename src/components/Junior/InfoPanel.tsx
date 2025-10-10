import React, { useId } from "react";
import { useStoreState } from "../../store";
import { useJrEditActions, useJrEditState } from "./hooks";
import { InfoPanelTabKey as TabKey } from "../../model/junior/edit-state";
import { Tabs, TabWithTypedKey } from "../TabWithTypedKey";
import { ErrorReportList } from "./ErrorReportList";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { Button } from "react-bootstrap";

const StandardOutput = () => {
  // TODO: Remove duplication between this and non-jr component.
  const text = useStoreState((state) => state.standardOutputPane.text);

  const maybePlaceholder =
    text === "" ? (
      <p className="info-pane-placeholder">
        Anything your program prints will appear here.
      </p>
    ) : null;

  return (
    <div className="StandardOutputPane">
      {maybePlaceholder}
      <pre className="SkulptStdout">{text}</pre>
    </div>
  );
};

const Errors = () => {
  const errorList = useStoreState((state) => state.errorReportList.errors);

  const nErrors = errorList.length;

  const content =
    nErrors === 0 ? (
      <p className="info-pane-placeholder">
        Any errors your project encounters will appear here.
      </p>
    ) : (
      <ErrorReportList />
    );

  return <div className="ErrorsPane">{content}</div>;
};

type InfoDisclosureProps = { tabContentId: string };
const InfoDisclosure: React.FC<InfoDisclosureProps> = ({ tabContentId }) => {
  const toggleStateAction = useJrEditActions((a) => a.toggleInfoPanelState);
  const toggleState = () => toggleStateAction();

  return (
    <div>
      <Button
        variant="outline-secondary"
        size="sm"
        className="disclosure-button expand-button m-1"
        onClick={toggleState}
        aria-label="Show output and errors"
        aria-expanded={false}
        aria-controls={tabContentId}
      >
        <FontAwesomeIcon className="me-2" icon="angle-right" />
        Output and errors
      </Button>
    </div>
  );
};

export const InfoPanel = () => {
  const activeTab = useJrEditState((s) => s.infoPanelActiveTab);
  const isCollapsed = useJrEditState((s) => s.infoPanelState === "collapsed");
  const setActiveTab = useJrEditActions((a) => a.expandAndSetActive);
  const toggleStateAction = useJrEditActions((a) => a.toggleInfoPanelState);
  const tabContentId = useId();

  const toggleState = () => toggleStateAction();

  const classes = classNames(
    "Junior-InfoPanel-container",
    "compact-tablist-container",
    { isCollapsed }
  );

  const ariaLabel = "Output, errors";

  const Tab = TabWithTypedKey<TabKey>;
  return (
    <section className={classes} aria-label={ariaLabel}>
      <Tabs
        id={tabContentId}
        className="Junior-InfoPanel"
        transition={false}
        activeKey={activeTab}
        onSelect={(k) => k && setActiveTab(k as TabKey)}
      >
        <Tab eventKey="output" title="Output">
          <StandardOutput />
        </Tab>
        <Tab eventKey="errors" title="Errors">
          <Errors />
        </Tab>
      </Tabs>
      <Button
        variant="outline-secondary"
        className="disclosure-button collapse-or-expand-button"
        onClick={toggleState}
        aria-label="Hide output and errors"
        aria-expanded={true}
        aria-controls={tabContentId}
      >
        <FontAwesomeIcon icon={"window-minimize"} />
      </Button>
    </section>
  );
};
