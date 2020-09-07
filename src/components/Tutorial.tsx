import React, { createRef, useEffect } from "react";
import { useStoreState, useStoreActions } from "../store";
import { SyncState } from "../model/project";
import RawElement from "./RawElement";

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
  const chapters = useStoreState(
    (state) => state.activeTutorial.tutorial?.chapters
  );

  if (chapters == null) {
    throw Error("no chapters to create navigation element");
  }

  const navigateToChapter = useStoreActions(
    (actions) => actions.activeTutorial.navigateToChapter
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

  return <RawElement element={element} />;
};

interface TutorialPatchElementProps {
  div: HTMLDivElement;
}

const TutorialPatchElement = ({ div }: TutorialPatchElementProps) => {
  let divCopy = div.cloneNode(true) as HTMLDivElement;
  let patchTable = divCopy.querySelector("div.patch table") as HTMLDivElement;

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

const ancestorHavingClass = (elt: HTMLElement, className: string) => {
  while (!elt.classList.contains(className)) {
    const maybeParent = elt.parentElement;
    if (maybeParent == null) {
      throw Error(`no parent while looking for ${className}`);
    }
    elt = maybeParent;
  }
  return elt;
};

const TutorialChapter = () => {
  const activeTutorial = useStoreState(
    (state) => state.activeTutorial.tutorial
  );
  const chapterDivRef: React.RefObject<HTMLDivElement> = createRef();

  useEffect(() => {
    const chapterDiv = chapterDivRef.current;
    if (chapterDiv != null) {
      const panelElt = ancestorHavingClass(
        chapterDiv,
        "TutorialChapter-container"
      );
      panelElt.scrollTo(0, 0);
    }
  });

  if (activeTutorial == null)
    throw Error("state is Syncd but no active tutorial");

  const chapterIndex = activeTutorial.activeChapterIndex;
  const activeChapter = activeTutorial.chapters[chapterIndex];

  return (
    <div className="TutorialChapter-scrollable">
      <div className="TutorialChapter-container">
        <div className="TutorialChapter" tabIndex={-1} ref={chapterDivRef}>
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
  const activeIndex = useStoreState(
    (state) => state.activeTutorial.tutorial?.activeChapterIndex
  );
  const navigateToChapter = useStoreActions(
    (actions) => actions.activeTutorial.navigateToChapter
  );

  if (activeIndex == null) {
    throw Error("no tutorial to construct ToC entry");
  }

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
  const tutorial = useStoreState((state) => state.activeTutorial.tutorial);
  if (tutorial == null) {
    throw Error("no tutorial to construct ToC");
  }

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
  const syncState = useStoreState((state) => state.activeTutorial.syncState);

  switch (syncState) {
    case SyncState.NoProject:
      // TODO: Would be nice to be able to give link straight to
      // particular tutorial, in which case the following might happen?
      // Or maybe that link would just show a short 'creating...'
      // message and then bounce onwards to "/ide/new-project-id".
      //
      // Think this should never happen.
      return <div>(No tutorial)</div>;
    case SyncState.Error:
      return <div>Error loading tutorial.</div>;
    case SyncState.SyncingToStorage:
      // Should never happen (unless we move tutorial creation into
      // the browser...).
      return (
        <div>Error: should not be trying to sync tutorial TO storage.</div>
      );
    case SyncState.SyncingFromStorage:
      return <div>Loading...</div>;
    case SyncState.Syncd:
      // Fall through to handle this case.
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
