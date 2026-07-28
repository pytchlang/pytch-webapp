import React, { useId, useRef } from "react";
import { useStoreState } from "../../store";
import { useJrEditActions, useJrEditState } from "./hooks";
import { InfoPanelTabKey as TabKey } from "../../model/junior/edit-state";
import { Tabs, TabWithTypedKey } from "../TabWithTypedKey";
import { ErrorReportList } from "./ErrorReportList";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { Button } from "react-bootstrap";
import { urlWithinApp } from "../../env-utils";
import { useTranslation } from "react-i18next";
import { PanelImperativeHandle } from "react-resizable-panels";
import {minInfoPanelHeight} from "../../constants";

const useIdeTranslation = () => useTranslation("ide");

export const StandardOutput = () => {
  // TODO: Remove duplication between this and non-jr component.
  const text = useStoreState((state) => state.standardOutputPane.text);
  const { t } = useIdeTranslation();

  const maybePlaceholder =
    text === "" ? (
      <div
        className={
          "d-flex flex-column justify-content-center align-items-center h-100"
        }
      >
        <img
          className={"ms-3 mb-1"}
          style={{ opacity: "15%", width: "70px" }}
          src={urlWithinApp(`/assets/snake-warning-placeholder.png`)}
          alt={""}
        />
        <p className="info-pane-placeholder text-center mt-1">
          {t("info.stdout.placeholder")}
        </p>
      </div>
    ) : null;

  const maybeText =
    text === "" ? null : <pre className="SkulptStdout">{text}</pre>;

  return (
    <div className="StandardOutputPane">
      {maybePlaceholder}
      {maybeText}
    </div>
  );
};

export const Errors = () => {
  const { t } = useIdeTranslation();
  const errorList = useStoreState((state) => state.errorReportList.errors);

  const nErrors = errorList.length;

  const content =
    nErrors === 0 ? (
      <div
        className={
          "d-flex flex-column justify-content-center align-items-center h-100"
        }
      >
        <img
          className={"ms-3 mb-1"}
          style={{ opacity: "15%", width: "70px" }}
          src={urlWithinApp(`/assets/snake-warning-placeholder.png`)}
          alt={""}
        />
        <p className="info-pane-placeholder text-center mt-1">
          {t("info.errors.placeholder")}
        </p>
      </div>
    ) : (
      <ErrorReportList />
    );

  return <div className="ErrorsPane">{content}</div>;
};

type InfoDisclosureProps = {
    tabContentId: string;
    resizablePanelRef?:
        | React.RefObject<PanelImperativeHandle | null>
        | undefined;
};
const InfoDisclosure: React.FC<InfoDisclosureProps> = ({
    tabContentId,
    resizablePanelRef,
}) => {
  const { t } = useIdeTranslation();
  const isCollapsed = useJrEditState((s) => s.infoPanelState === "collapsed");
  const toggleStateAction = useJrEditActions((a) => a.toggleInfoPanelState);
  const toggleState = () => {
    console.log('expand panel');
    if (isCollapsed) {
      toggleStateAction();
      resizablePanelRef?.current.expand();
      if (resizablePanelRef?.current.getSize().inPixels === minInfoPanelHeight) resizablePanelRef.current.resize(380);
    }
  };

  const errorList = useStoreState((state) => state.errorReportList.errors);
  const nErrors = errorList.length;

  return (
    <div className={"h-100"}>
      <Button
        variant="outline-secondary"
        size="sm"
        className="d-flex align-items-center disclosure-button expand-button m-0 h-100"
        onClick={toggleState}
        aria-label={t("info.expand-button.aria-label")}
        aria-expanded={false}
        aria-controls={tabContentId}
      >
        <FontAwesomeIcon
          className="me-2"
          size={"lg"}
          icon="circle-exclamation"
        />
        <div style={{ marginTop: 1 }}>{`${t("info.expand-button.label")}${
          nErrors > 0 ? " (" + nErrors + ")" : ""
        }`}</div>
      </Button>
    </div>
  );
};

interface InfoPanelProps {
  resizablePanelRef?: React.RefObject<PanelImperativeHandle | null>;
}

export const InfoPanel = ({ resizablePanelRef }: InfoPanelProps) => {
  const { t } = useIdeTranslation();
  const activeTab = useJrEditState((s) => s.infoPanelActiveTab);
  const isCollapsed = useJrEditState((s) => s.infoPanelState === "collapsed");
  const setActiveTab = useJrEditActions((a) => a.expandAndSetActive);
  const toggleStateAction = useJrEditActions((a) => a.toggleInfoPanelState);
  const tabContentId = useId();
  const wasCollapsedRef = useRef<boolean | null>(null);

  const toggleState = () => {
    console.log('collapse panel');
    if (!isCollapsed) {
      toggleStateAction();
      resizablePanelRef?.current.collapse();
    }
  };

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

  const errorList = useStoreState((state) => state.errorReportList.errors);
  const nErrors = errorList.length;

  return (
    <section
      className={classes}
      aria-label={t("info.aria-label")}
      ref={maybeFocusButton}
    >
      <Tabs
        id={tabContentId}
        className={tabPanelClasses}
        transition={false}
        activeKey={activeTab}
        onSelect={(k) => k && setActiveTab(k as TabKey)}
      >
          <Tab
            eventKey="output"
            title={
              <>
                <FontAwesomeIcon icon={"circle-info"} className={"me-1"} />
                {t("info.stdout.tab-title")}
              </>
            }
            role={"log"}
          >
            <StandardOutput />
          </Tab>
          <Tab
            eventKey="errors"
            title={
              nErrors === 0 ? (
                <div className={"d-flex align-items-center"}>
                  <FontAwesomeIcon
                    icon={"bug"}
                    className={"me-1"}
                    style={{ marginBottom: 1 }}
                  />
                  <div className={"me-1"}>{t("info.errors.tab-title")}</div>
                </div>
              ) : (
                <>
                  <FontAwesomeIcon
                    icon={"bug"}
                    className={"me-1"}
                    style={{ marginBottom: 1 }}
                  />{" "}
                  {`${t("info.errors.tab-title")} (${nErrors})`}
                </>
              )
            }
            role={"log"}
          >
            <Errors />
          </Tab>
      </Tabs>
      {isCollapsed ? (
        <InfoDisclosure
          tabContentId={tabContentId}
          resizablePanelRef={resizablePanelRef}
        />
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
    </section>
  );
};
