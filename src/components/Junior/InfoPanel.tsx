import React, { useId, useRef } from "react";
import { useStoreState } from "../../store";
import { useJrEditActions, useJrEditState } from "./hooks";
import { InfoPanelTabKey as TabKey } from "../../model/junior/edit-state";
import { Tabs, TabWithTypedKey } from "../TabWithTypedKey";
import { ErrorReportList } from "./ErrorReportList";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { SectionWithHiddenH2 } from "../SectionWithHiddenH2";

const useIdeTranslation = () => useTranslation("ide");

const StandardOutput = () => {
  // TODO: Remove duplication between this and non-jr component.
  const text = useStoreState((state) => state.standardOutputPane.text);
  const { t } = useIdeTranslation();

  const maybePlaceholder =
    text === "" ? (
      <p className="info-pane-placeholder">{t("info.stdout.placeholder")}</p>
    ) : null;

  return (
    <div className="StandardOutputPane">
      {maybePlaceholder}
      <pre className="SkulptStdout">{text}</pre>
    </div>
  );
};

const Errors = () => {
  const { t } = useIdeTranslation();
  const errorList = useStoreState((state) => state.errorReportList.errors);

  const nErrors = errorList.length;

  const content =
    nErrors === 0 ? (
      <p className="info-pane-placeholder">{t("info.errors.placeholder")}</p>
    ) : (
      <ErrorReportList />
    );

  return <div className="ErrorsPane">{content}</div>;
};

type InfoDisclosureProps = { tabContentId: string };
const InfoDisclosure: React.FC<InfoDisclosureProps> = ({ tabContentId }) => {
  const { t } = useIdeTranslation();
  const toggleStateAction = useJrEditActions((a) => a.toggleInfoPanelState);
  const toggleState = () => toggleStateAction();

  return (
    <div>
      <Button
        variant="outline-secondary"
        size="sm"
        className="disclosure-button expand-button m-1"
        onClick={toggleState}
        aria-label={t("info.expand-button.aria-label")}
        aria-expanded={false}
        aria-controls={tabContentId}
      >
        <FontAwesomeIcon className="me-2" icon="angle-right" />
        {t("info.expand-button.label")}
      </Button>
    </div>
  );
};

export const InfoPanel = () => {
  const { t } = useIdeTranslation();
  const activeTab = useJrEditState((s) => s.infoPanelActiveTab);
  const isCollapsed = useJrEditState((s) => s.infoPanelState === "collapsed");
  const setActiveTab = useJrEditActions((a) => a.expandAndSetActive);
  const toggleStateAction = useJrEditActions((a) => a.toggleInfoPanelState);
  const tabContentId = useId();
  const wasCollapsedRef = useRef<boolean | null>(null);

  const toggleState = () => toggleStateAction();

  const classes = classNames(
    "Junior-InfoPanel-container",
    "compact-tablist-container",
    { isCollapsed }
  );

  const tabPanelClasses = classNames(
    "Junior-InfoPanel",
    isCollapsed && "d-none"
  );

  const maybeFocusButton = (elt: HTMLElement | null) => {
    if (elt != null && wasCollapsedRef.current !== isCollapsed) {
      if (wasCollapsedRef.current != null) {
        const mButton = elt.querySelector(
          ":scope .disclosure-button"
        ) as HTMLButtonElement | null;
        mButton?.focus();
      }
      wasCollapsedRef.current = isCollapsed;
    }
  };

  const Tab = TabWithTypedKey<TabKey>;
  return (
    <SectionWithHiddenH2
      className={classes}
      headingContent={t("info.aria-label")}
      ref={maybeFocusButton}
    >
      <Tabs
        id={tabContentId}
        className={tabPanelClasses}
        transition={false}
        activeKey={activeTab}
        onSelect={(k) => k && setActiveTab(k as TabKey)}
      >
        <Tab eventKey="output" title={t("info.stdout.tab-title")}>
          <StandardOutput />
        </Tab>
        <Tab eventKey="errors" title={t("info.errors.tab-title")}>
          <Errors />
        </Tab>
      </Tabs>
      {isCollapsed ? (
        <InfoDisclosure tabContentId={tabContentId} />
      ) : (
        <Button
          variant="outline-secondary"
          className="disclosure-button collapse-button"
          onClick={toggleState}
          aria-label={t("info.collapse-button.aria-label")}
          aria-expanded={true}
          aria-controls={tabContentId}
        >
          <FontAwesomeIcon icon={"window-minimize"} />
        </Button>
      )}
    </SectionWithHiddenH2>
  );
};
