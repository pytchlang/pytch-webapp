import React from "react";
import { useStoreState } from "../../store";
import { useJrEditActions, useJrEditState } from "./hooks";
import { InfoPanelTabKey as TabKey } from "../../model/junior/edit-state";
import { Tabs, TabWithTypedKey } from "../TabWithTypedKey";
import { ErrorReportList } from "./ErrorReportList";

import classNames from "classnames";

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

export const InfoPanel = () => {
  const activeTab = useJrEditState((s) => s.infoPanelActiveTab);
  const isCollapsed = useJrEditState((s) => s.infoPanelState === "collapsed");
  const setActiveTab = useJrEditActions((a) => a.setInfoPanelActiveTab);

  const classes = classNames("Junior-InfoPanel-container", { isCollapsed });
  const Tab = TabWithTypedKey<TabKey>;
  return (
    <div className={classes}>
      <Tabs
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
    </div>
  );
};
