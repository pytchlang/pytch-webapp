import { Button, Col, Container, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Markdown from "react-markdown";
import React, { KeyboardEventHandler, useRef } from "react";
import { useStoreActions, useStoreState } from "../../store";
import { useLinkedDemo, useMappedLinkedDemo } from "../Junior/lesson/hooks";
import classNames from "classnames";
import { EmptyProps } from "../../utils";
import { demoAssetUrl } from "../../model/discoverable-demos";
import { MaybeSeizeFocus } from "../MaybeSeizeFocus";

const DemoChapterNavigation: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("demos");
  const linkedDemo = useLinkedDemo();
  const activeChapter = useStoreState(
    (state) => state.ideLayout.demoSidebar.activeChapter
  );
  const setActiveChapter = useStoreActions(
    (actions) => actions.ideLayout.demoSidebar.setActiveChapter
  );

  const headings = linkedDemo.demo.headings;

  function handlePrevChapterClicked() {
    if (headings.length) {
      let newActiveChapter = activeChapter - 1;
      if (newActiveChapter < 0) newActiveChapter = headings.length - 1;
      setActiveChapter(newActiveChapter);
    } else return 0;
  }

  const handlePrevChapterKeyDown: KeyboardEventHandler = (e) => {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight": {
        e.preventDefault();
        handleFocusOnNextChapter();
        break;
      }
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        break;
    }
  };

  function handleFocusOnPrevChapter() {
    let currentButton = document.activeElement;
    let prevButton = currentButton?.previousElementSibling as HTMLElement;
    prevButton?.focus();
  }

  function handleNextChapterClicked() {
    if (headings.length) {
      let newActiveChapter = activeChapter + 1;
      if (newActiveChapter >= headings.length) newActiveChapter = 0;
      setActiveChapter(newActiveChapter);
    } else return 0;
  }

  const handleNextChapterKeyDown: KeyboardEventHandler = (e) => {
    switch (e.key) {
      case "ArrowUp":
      case "ArrowLeft": {
        e.preventDefault();
        handleFocusOnPrevChapter();
        break;
      }
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        break;
    }
  };

  function handleFocusOnNextChapter() {
    let currentButton = document.activeElement;
    let nextButton = currentButton?.nextElementSibling as HTMLElement;
    nextButton?.focus();
  }

  return (
    <>
      <Button
        key={"prev-chapter"}
        aria-label={t("sidebar.prev-chapter.aria-label")}
        variant={"primary"}
        className={"prev-chapter"}
        onClick={handlePrevChapterClicked}
        onKeyDown={handlePrevChapterKeyDown}
      >
        <FontAwesomeIcon
          icon={"angle-right"}
          color={"white"}
          flip={"horizontal"}
        />
      </Button>
      <Button
        key={"next-chapter"}
        aria-label={t("sidebar.next-chapter.aria-label")}
        tabIndex={-1}
        variant={"primary"}
        className={"ms-1 next-chapter"}
        onClick={handleNextChapterClicked}
        onKeyDown={handleNextChapterKeyDown}
      >
        <FontAwesomeIcon icon={"angle-right"} color={"white"} />
      </Button>
    </>
  );
};

type DemoChapterBodyProps = { markdown: string };

/** Render the given `markdown`, adjusting each `<img>` element in the
 * rendered output such that its `src` attribute points inside the
 * `content/assets` folder within the current demo. */
const DemoChapterBody: React.FC<DemoChapterBodyProps> = ({ markdown }) => {
  const demoUuid = useMappedLinkedDemo((demo) => demo.demo.uuid);

  const maybePatchAssetUrls = (div: HTMLDivElement | null) => {
    if (div == null || div.dataset.assetUrlsPatched === "yes") return;

    const imgElts = div.querySelectorAll("img");
    imgElts.forEach((imgElt) => {
      const rawSrc = imgElt.getAttribute("src");
      if (rawSrc == null) return; // Shouldn't happen?

      const newSrc = demoAssetUrl(demoUuid, rawSrc);
      imgElt.setAttribute("src", newSrc);
    });

    const anchorElts = div.querySelectorAll("a");
    anchorElts.forEach((anchorElt) => {
      const rawHref = anchorElt.getAttribute("href");
      if (rawHref == null) return; // Shouldn't happen?

      // URLs which are to be patched to refer to content-local assets
      // have to begin explicitly with "./".  Only patch these.
      if (rawHref.startsWith("./")) {
        const newHref = demoAssetUrl(demoUuid, rawHref);
        anchorElt.setAttribute("href", newHref);
      }

      // But all anchors should open in a new tab:
      anchorElt.setAttribute("target", "_blank");
    });

    div.dataset.assetUrlsPatched = "yes";
  };

  return (
    <div ref={maybePatchAssetUrls} className="DemoChapterBody-wrapper">
      <Markdown>{markdown}</Markdown>
    </div>
  );
};

export const DemoChapter = () => {
  const demoUuid = useMappedLinkedDemo((demo) => demo.demo.uuid);
  const activeChapter = useStoreState(
    (state) => state.ideLayout.demoSidebar.activeChapter
  );
  const isNavigationExpanded = useStoreState(
    (state) => state.ideLayout.demoSidebar.isNavigationExpanded
  );
  const contentRef = useRef<HTMLElement>(null);

  const linkedDemo = useLinkedDemo();
  const headings = linkedDemo.demo.headings;
  const chapters = linkedDemo.demo.chapters;

  // Make sure we get a fresh render into a fresh DIV whenever the
  // chapter changes.  Without this, the self-same DIV is re-used,
  // breaking the mechanism in <DemoChapterBody> for detecting when the
  // "patch URLs" work has been done.
  const bodyKey = `${demoUuid}/${activeChapter}`;

  return (
    <Row className={"demo-chapter"}>
      <Container
        className={classNames("chapter-content", "pt-3", {
          isNavigationExpanded,
        })}
      >
        <Row className={"mb-3 px-4"}>
          <div className={"w-50 flex-grow-1 align-items-center d-flex p-0"}>
            <h2 className={"chapter-heading"}>
              <div className={"d-flex flex-row"}>
                <div className={"w-100"}>
                  {headings.length > 1 ? (
                    <span className={"me-1"}>{activeChapter + 1}.</span>
                  ) : undefined}
                  <span>
                    <Markdown
                      components={{
                        p(props) {
                          return <span>{props.children}</span>;
                        },
                      }}
                    >
                      {headings[activeChapter]}
                    </Markdown>
                  </span>
                </div>
              </div>
            </h2>
          </div>
          {headings.length > 1 ? (
            <div className={"w-auto chapter-navigation"}>
              <DemoChapterNavigation />
            </div>
          ) : undefined}
        </Row>
        <Row className={"flex-grow-1 chapter-markdown-wrapper"}>
          <MaybeSeizeFocus targetRef={contentRef} />
          <Col
            className={"chapter-markdown px-4 gfs__help-content"}
            tabIndex={0}
            ref={contentRef}
          >
            <DemoChapterBody key={bodyKey} markdown={chapters[activeChapter]} />
          </Col>
        </Row>
      </Container>
    </Row>
  );
};
