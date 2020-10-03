import React, { createRef, useEffect, useRef } from "react";
import { useStoreState, useStoreActions } from "../store";
import { SyncState } from "../model/project";
import RawElement from "./RawElement";
import { ancestorHavingClass, failIfNull } from "../utils";

import "../pytch-tutorial.scss";

interface TutorialNavigationProps {
  kind: "prev" | "next"; // TODO: Change to enum?
  toChapterIndex: number;
}

const navigationIntroFromKind = (kind: string) => {
  switch (kind) {
    case "prev":
      return "Back";
    case "next":
      return "Next";
    default:
      throw Error(`unknown nav-kind ${kind}`);
  }
};

const TutorialNavigation = ({
  kind,
  toChapterIndex,
}: TutorialNavigationProps) => {
  const maybeChapters = useStoreState(
    (state) => state.activeProject.project?.trackedTutorial?.content.chapters
  );

  const chapters = failIfNull(
    maybeChapters,
    "no chapters to create navigation element"
  );

  const navigateToChapter = useStoreActions(
    (actions) => actions.activeProject.setActiveTutorialChapter
  );

  const navigateToTargetChapter = () => navigateToChapter(toChapterIndex);

  const toChapterTitle = chapters[toChapterIndex].title;
  const navClass = `navigation-button navigation-${kind}`;
  return (
    <span className={navClass} onClick={navigateToTargetChapter}>
      {navigationIntroFromKind(kind)}: {toChapterTitle}
    </span>
  );
};

interface TutorialElementProps {
  element: HTMLElement;
}

const TutorialElement = ({ element }: TutorialElementProps) => {
  if (
    element instanceof HTMLDivElement &&
    element.classList.contains("patch-container")
  ) {
    return <TutorialPatchElement div={element} />;
  }

  if (
    element instanceof HTMLDivElement &&
    element.classList.contains("run-finished-project")
  ) {
    return <TutorialTryWholeProjectElement />;
  }

  return <RawElement element={element} />;
};

const TutorialTryWholeProjectElement = () => {
  const maybeTutorial = useStoreState(
    (state) => state.activeProject.project?.trackedTutorial?.content
  );
  const setCodeTextAndBuild = useStoreActions(
    (actions) => actions.activeProject.setCodeTextAndBuild
  );

  const tutorial = failIfNull(
    maybeTutorial,
    "need active tutorial to construct TRY IT button"
  );

  const tryProject = () => {
    setCodeTextAndBuild({
      codeText: tutorial.completeCode,
      thenGreenFlag: true,
    });
  };

  return (
    <div>
      <span onClick={tryProject} className="navigation-button navigation-next">
        Try the finished project!
      </span>
    </div>
  );
};

interface TutorialPatchElementProps {
  div: HTMLDivElement;
}

const TutorialPatchElement = ({ div }: TutorialPatchElementProps) => {
  let divCopy = div.cloneNode(true) as HTMLDivElement;
  let patchTable = divCopy.querySelector(
    "div.patch table"
  ) as HTMLDivElement | null;

  if (patchTable == null) {
    // Maybe this is a warning, e.g., for slug-not-found?  Don't crash,
    // anyway.
    console.log("TutorialPatchElement: no 'div.patch table'", div);
    return <RawElement element={div} />;
  }

  // TODO: This whole approach would probably benefit from being re-done
  // such that the tutorial data is delivered as JSON rather than HTML.
  // That would make it easier to do things like store the diffs more
  // efficiently and not repeat the 'code so far' at every point, as
  // well as avoiding this kind of hybrid React / direct DOM
  // manipulation.

  let tbodyAddElts = patchTable.querySelectorAll("tbody.diff-add");

  tbodyAddElts.forEach((tbodyElement) => {
    const tbody = tbodyElement as HTMLTableSectionElement;
    let copyButton = document.createElement("div");
    copyButton.className = "copy-button";
    copyButton.innerHTML =
      '<p class="content">COPY</p><p class="feedback">✓&nbsp;Copied!</p>';
    copyButton.onclick = (evt: MouseEvent) => {
      console.log(evt);
      const pContent = evt.target as HTMLElement;
      pContent.parentElement!.querySelectorAll("p").forEach((node) => {
        const elt = node as HTMLParagraphElement;
        elt.classList.add("active");
        elt.onanimationend = () => {
          elt.classList.remove("active");
        };
      });
      navigator.clipboard.writeText(tbody.dataset.addedText!);
    };

    let topRightCell = tbody.querySelector("tr > td:last-child");
    topRightCell!.appendChild(copyButton);
  });

  const patchDiv = <RawElement className="patch" element={patchTable} />;
  return (
    <div className="patch-container">
      <h1 className="decoration">Change the code like this:</h1>
      {patchDiv}
    </div>
  );
};

interface TutorialScrollerProps {
  containerDivRef: React.RefObject<HTMLDivElement>;
}

// This is a bit of a fudge.  The seqnum is used to re-"render" this
// component, whose only job is to scroll the chapter container to the
// top.  The seqnum is incremented when an explicit navigation action
// takes place.  The scroll position is maintained if the user just
// switches to, say, the Output tab and back again.
const TutorialScroller: React.FC<TutorialScrollerProps> = (props) => {
  const seqnum = useStoreState(
    (state) => state.activeProject.tutorialNavigationSeqnum
  );
  const lastActedSeqnumRef = useRef(0);

  useEffect(() => {
    const containerDiv = props.containerDivRef.current;
    if (containerDiv != null && seqnum !== lastActedSeqnumRef.current) {
      containerDiv.scrollTo(0, 0);
      lastActedSeqnumRef.current = seqnum;
    }
  });

  return <></>;
};

const TutorialChapter = () => {
  const maybeTrackedTutorial = useStoreState(
    (state) => state.activeProject.project?.trackedTutorial
  );
  const chapterContainerRef: React.RefObject<HTMLDivElement> = createRef();

  const trackedTutorial = failIfNull(
    maybeTrackedTutorial,
    "no tracked tutorial"
  );

  const chapterIndex = trackedTutorial.activeChapterIndex;
  const activeChapter = trackedTutorial.content.chapters[chapterIndex];

  return (
    <div className="TutorialChapter-scrollable">
      <div className="TutorialChapter-container" ref={chapterContainerRef}>
        <div className="TutorialChapter" tabIndex={-1}>
          {activeChapter.contentElements.map((element, idx) => (
            <TutorialElement key={idx} element={element} />
          ))}
          <div className="navigation-buttons">
            {activeChapter.maybePrevTitle && (
              <TutorialNavigation
                kind="prev"
                toChapterIndex={chapterIndex - 1}
              />
            )}
            {activeChapter.maybeNextTitle && (
              <TutorialNavigation
                kind="next"
                toChapterIndex={chapterIndex + 1}
              />
            )}
          </div>
        </div>
      </div>
      <TutorialScroller containerDivRef={chapterContainerRef} />
    </div>
  );
};

interface TutorialTableOfContentsEntryProps {
  chapterIndex: number;
  chapterTitle: string;
}

const TutorialTableOfContentsEntry = ({
  chapterIndex,
  chapterTitle,
}: TutorialTableOfContentsEntryProps) => {
  const maybeActiveIndex = useStoreState(
    (state) => state.activeProject.project?.trackedTutorial?.activeChapterIndex
  );
  const navigateToChapter = useStoreActions(
    (actions) => actions.activeProject.setActiveTutorialChapter
  );

  const activeIndex = failIfNull(
    maybeActiveIndex,
    "no tutorial to construct ToC entry"
  );

  const navigate = () => navigateToChapter(chapterIndex);
  return (
    <li
      onClick={navigate}
      className={chapterIndex === activeIndex ? "active" : undefined}
    >
      {chapterTitle}
    </li>
  );
};

const TutorialTableOfContents = () => {
  const maybeTutorial = useStoreState(
    (state) => state.activeProject.project?.trackedTutorial?.content
  );
  const tutorial = failIfNull(maybeTutorial, "no tutorial to construct ToC");

  return (
    <div className="ToC-scrollable">
      <div className="ToC-container">
        <ul className="ToC">
          {tutorial.chapters.map((chapter, chapterIndex) => (
            <TutorialTableOfContentsEntry
              key={chapterIndex}
              chapterIndex={chapterIndex}
              chapterTitle={chapter.title}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

const Tutorial = () => {
  const syncState = useStoreState((state) => state.activeProject.syncState);

  switch (syncState) {
    case SyncState.SyncNotStarted:
      // TODO: Would be nice to be able to give link straight to
      // particular tutorial, in which case the following might happen?
      // Or maybe that link would just show a short 'creating...'
      // message and then bounce onwards to "/ide/new-project-id".
      //
      // Think this should never happen.
      return <div>(No tutorial)</div>;
    case SyncState.Error:
      return <div>Error loading tutorial.</div>;
    case SyncState.SyncingFromBackEnd:
      return <div>Loading...</div>;
    case SyncState.SyncingToBackEnd:
    case SyncState.Syncd:
      // Fall through to handle these cases.
      break;
  }

  return (
    <div className="tutorial-pane">
      <TutorialTableOfContents />
      <TutorialChapter />
    </div>
  );
};

export default Tutorial;
