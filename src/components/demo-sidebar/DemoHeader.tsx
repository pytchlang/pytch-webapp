import React, { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Row } from "react-bootstrap";
import { useStoreActions, useStoreState } from "../../store";
import { useLinkedDemo } from "../Junior/lesson/hooks";
import classNames from "classnames";

/** Put style in SCSS not inline.  Then you can use variables like
 * $pytch-colour-main-yellow instead of the RGB string. */

/** Handling "loading" state should be done higher up. - Done*/

/** Same comment as elsewhere re should we distinguish between
 * "monolithic" and "structured" demos (according to one big lump vs
 * split into chapters). */

export const DemoHeader = ({
  chaptersRef,
  navCaretRef,
}: {
  chaptersRef: RefObject<(HTMLLIElement | null)[]>;
  navCaretRef: RefObject<HTMLButtonElement | null>;
}) => {
  const { t } = useTranslation("demos");
  const activeChapter = useStoreState(
    (state) => state.ideLayout.demoSidebar.activeChapter
  );

  const isNavigationExpanded = useStoreState(
    (state) => state.ideLayout.demoSidebar.isNavigationExpanded
  );

  const setIsNavigationExpanded = useStoreActions(
    (actions) => actions.ideLayout.demoSidebar.setIsNavigationExpanded
  );

  const linkedDemo = useLinkedDemo();
  const nChapters = linkedDemo.demo.headings.length;

  const demoName = (
    <div className={classNames("p-0", "m-0", "w-auto")}>
      <h2 className={"m-0"}>{linkedDemo.demo.displayName}</h2>
    </div>
  );

  const demoChapterCount = (
    <div className={classNames("chapter-pill", "rounded-pill")}>
      <FontAwesomeIcon icon={"layer-group"} />
      <span
        aria-label={t("sidebar.chapter-count.aria-label", {
          replace: { current: activeChapter + 1, total: nChapters },
        })}
      >
        {activeChapter + 1}/{nChapters}
      </span>
    </div>
  );

  const demoChapterNavButton = (
    <Button
      aria-label={t("sidebar.nav-toggle.aria-label")}
      className={classNames("w-auto", "caret", "p-0", "ms-2", {
        isNavigationExpanded,
      })}
      key={"nav-caret"}
      id={"nav-caret"}
      ref={navCaretRef}
      onClick={() => {
        setIsNavigationExpanded(!isNavigationExpanded);
        navCaretRef.current?.focus();
      }}
      onFocus={() => {
        chaptersRef.current[activeChapter]?.scrollIntoView({
          behavior: "smooth",
        });
      }}
    >
      <FontAwesomeIcon
        icon={"caret-down"}
        className={classNames("nav-caret", { isNavigationExpanded })}
      />
    </Button>
  );

  const demoHeaderMono = demoName;

  const demoHeaderStructured = (
    <>
      {demoName}
      <div className={classNames("w-auto", "d-flex")}>
        {demoChapterCount}
        {demoChapterNavButton}
      </div>
    </>
  );

  return (
    <Row className={classNames("demo-header", "pt-4 pb-3 px-3")}>
      {nChapters > 1 ? demoHeaderStructured : demoHeaderMono}
    </Row>
  );
};
