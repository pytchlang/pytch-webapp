import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Col, Container, Row } from "react-bootstrap";
import { useLinkedDemo } from "../Junior/lesson/hooks";
import { DemoHeader } from "./DemoHeader";
import { ChaptersOverview } from "./ChaptersOverview";
import { DemoChapter } from "./DemoChapter";
import { useStoreActions, useStoreState } from "../../store";
import classNames from "classnames";
import { format } from "date-fns/format";
import Markdown from "react-markdown";
import "../Junior/activities/Activity.scss";

export const DemoSidebar = () => {
  const { t } = useTranslation("demos");
  const linkedDemo = useLinkedDemo();

  const isNavigationExpanded = useStoreState(
    (state) => state.ideLayout.demoSidebar.isNavigationExpanded
  );

  const setIsNavigationExpanded = useStoreActions(
    (actions) => actions.ideLayout.demoSidebar.setIsNavigationExpanded
  );

  const setActiveChapter = useStoreActions(
    (actions) => actions.ideLayout.demoSidebar.setActiveChapter
  );

  const chaptersRef = useRef<Array<HTMLLIElement | null>>([]);
  const navCaretRef = useRef<HTMLButtonElement | null>(null);

  const nChapters = linkedDemo.demo.headings.length;
  chaptersRef.current = chaptersRef.current.slice(0, nChapters);

  useEffect(() => {
    setIsNavigationExpanded(nChapters > 1);

    // reset to prevent new demo from starting at a non-existing chapter
    // on load
    setActiveChapter(0);
  }, [nChapters, setIsNavigationExpanded, setActiveChapter]);

  // the following useEffect methods are needed to return focus to the
  // previously used button after scrolling to the active chapter in the
  // chapter navigation
  useEffect(() => {
    navCaretRef.current?.focus();
  }, [isNavigationExpanded]);

  const demoSubheader = (
    <Row
      className={classNames(
        "demo-sub-header",
        "px-4",
        linkedDemo.demo.summaryMarkdown ? "py-3" : "py-2"
      )}
    >
      <Col>
        <Markdown>{linkedDemo.demo.summaryMarkdown}</Markdown>
      </Col>
    </Row>
  );

  const absTimestamp = format(linkedDemo.demo.lastUpdated, "PP");
  const demoFooter = (
    <Row className={"demo-footer py-3 px-3"}>
      <div>
        <p>{linkedDemo.demo.authorName}</p>
        <p>{t("sidebar.published-on", { replace: { date: absTimestamp } })}</p>
      </div>
    </Row>
  );

  return (
    <div className="DemoSidebar" tabIndex={-1}>
      <div className="content">
        <div className="inner-content">
          <Container>
            <DemoHeader chaptersRef={chaptersRef} navCaretRef={navCaretRef} />
            {demoSubheader}
            <ChaptersOverview chaptersRef={chaptersRef} />
            <DemoChapter />
            {demoFooter}
          </Container>
        </div>
      </div>
    </div>
  );
};
