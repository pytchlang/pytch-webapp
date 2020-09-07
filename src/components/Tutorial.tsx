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
    copyButton.innerHTML = "<p>COPY</p>";
    copyButton.onclick = () => {
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

const TutorialChapter = () => {
  const syncState = useStoreState((state) => state.activeTutorial.syncState);
  const activeTutorial = useStoreState(
    (state) => state.activeTutorial.tutorial
  );
  const chapterDivRef: React.RefObject<HTMLDivElement> = createRef();

  useEffect(() => {
    const chapterDiv = chapterDivRef.current;
    if (chapterDiv != null) {
      const panelElt = chapterDiv.parentElement?.parentElement;
      if (panelElt == null) {
        throw Error("could not find grandparent of chapter-div");
      }
      panelElt.scrollTo(0, 0);
    }
  });

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

  if (activeTutorial == null)
    throw Error("state is Syncd but no active tutorial");

  const chapterIndex = activeTutorial.activeChapterIndex;
  const activeChapter = activeTutorial.chapters[chapterIndex];

  return (
    <div className="TutorialChapter" tabIndex={-1} ref={chapterDivRef}>
      {activeChapter.contentElements.map((element, idx) => (
        <TutorialElement key={idx} element={element} />
      ))}
      <div className="navigation-buttons">
        {activeChapter.maybePrevTitle && (
          <TutorialNavigation kind="prev" toChapterIndex={chapterIndex - 1} />
        )}
        {activeChapter.maybeNextTitle && (
          <TutorialNavigation kind="next" toChapterIndex={chapterIndex + 1} />
        )}
      </div>
    </div>
  );
};

const Tutorial = () => {
  // TODO: Split pane with table of contents to left, content to right.
  return <TutorialChapter />;
};

export default Tutorial;
