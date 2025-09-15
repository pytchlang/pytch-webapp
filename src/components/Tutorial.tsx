import React, { ClipboardEventHandler, createRef, useRef } from "react";
import { useStoreState, useStoreActions } from "../store";
import RawElement from "./RawElement";
import Button from "react-bootstrap/Button";
import {
  assertNever,
  copyTextToClipboard,
  failIfNull,
  isDivOfClass,
} from "../utils";
import { DiffHelpSamples } from "../model/user-interactions/code-diff-help";
import { makeScratchSVG } from "../model/scratchblocks-render";

import "../pytch-tutorial.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRunFlow } from "../model";
import { ProgressTrail } from "./Junior/lesson/ProgressTrail";
import { WidthMonitor } from "./Junior/WidthMonitor";
import { DivScroller } from "./Junior/lesson/DivScroller";
import { useMappedTrackedTutorial } from "./hooks/tracked-tutorial";
import {
  ChapterNavigationButtons,
  ChapterNavigationButtonsProps,
} from "./Junior/lesson/ChapterNavigationButtons";
import { focusChapterContent } from "./Junior/lesson/hooks";

type NavigationDirection = "prev" | "next";

interface TutorialNavigationProps {
  kind: NavigationDirection;
  toChapterIndex: number;
}

const navigationIntro = (kind: NavigationDirection, toChapterIndex: number) => {
  switch (kind) {
    case "prev":
      return "Back";
    case "next":
      return toChapterIndex === 1 ? "Get started" : "Next";
    default:
      return assertNever(kind);
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
      {navigationIntro(kind, toChapterIndex)}: {toChapterTitle}
    </span>
  );
};

interface TutorialElementProps {
  element: HTMLElement;
}

const TutorialElement = ({ element }: TutorialElementProps) => {
  if (isDivOfClass(element, "patch-container")) {
    return <TutorialPatchElement div={element} />;
  }

  if (isDivOfClass(element, "run-finished-project")) {
    return <TutorialTryWholeProjectElement />;
  }

  if (
    element instanceof HTMLPreElement &&
    element.firstChild instanceof HTMLElement &&
    element.firstChild.classList.contains("language-scratch")
  ) {
    const sbSvg = makeScratchSVG(element.innerText, 0.8);
    return <RawElement className="scratchblocks" element={sbSvg} />;
  }
  return <RawElement element={element} />;
};

// TODO: Remove this feature?  The preferred method for a user to try
// the finished version of a tutorial is to use the "demo" button in the
// tutorial's card.
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
      focusDestination: "running-project",
    });
  };

  // Does the tutorial have at least one chapter beyond the front
  // matter?  (It would be very surprising if not, but check.)
  const hasNextChapter = tutorial.chapters.length > 1;

  return (
    <div className="navigation-buttons">
      <span
        onClick={tryProject}
        className="navigation-button navigation-run-project"
      >
        Try the finished project!
      </span>
      {hasNextChapter ? (
        <TutorialNavigation kind="next" toChapterIndex={1} />
      ) : null}
    </div>
  );
};

interface TutorialPatchElementProps {
  div: HTMLDivElement;
}

// TODO: This whole approach would probably benefit from being re-done
// such that the tutorial data is delivered as JSON rather than HTML.
// That would make it easier to do things like store the diffs more
// efficiently and not repeat the 'code so far' at every point, as
// well as avoiding this kind of hybrid React / direct DOM
// manipulation.

const VerticalEllipsis = () => {
  return (
    <div className="patch-hunk-spacer">
      <span>⋮</span>
    </div>
  );
};

const showLeadingSpaces = (table: HTMLTableElement) => {
  const leadingSpaces = new RegExp("^ +");
  table.querySelectorAll("tbody tr td:nth-child(3) pre").forEach((pre) => {
    const text = pre.textContent || "";
    const match = leadingSpaces.exec(text);
    if (match != null) {
      const nSpaces = match[0].length;
      const visibleLeadin = "·".repeat(nSpaces);
      const lineBody = text.substring(nSpaces);

      // Do this manually do avoid "nested render" warnings were we to
      // use JSX and ReactDOM.render().
      let span = document.createElement("span");
      span.classList.add("visible-leading-spaces");
      span.innerText = visibleLeadin;
      pre.textContent = lineBody;
      pre.insertBefore(span, pre.firstChild);
    }
  });
};

const insertAddAndDelSymbols = (table: HTMLTableElement) => {
  table.querySelectorAll("tbody tr").forEach((tr) => {
    tr.removeChild(tr.childNodes[1]);
    let lastTd = tr.lastChild as HTMLTableCellElement;
    lastTd.classList.add("code-text");
  });

  let addSpan = document.createElement("span");
  addSpan.classList.add("add-or-del");
  addSpan.innerText = "+";

  let delSpan = document.createElement("span");
  delSpan.classList.add("add-or-del");
  delSpan.innerText = "−";

  table.querySelectorAll("tbody.diff-add").forEach((tbody_) => {
    const tbody = tbody_ as HTMLTableSectionElement;
    let firstRow = true;
    tbody.querySelectorAll("tr").forEach((tr) => {
      if (firstRow) {
        let td0 = tr.firstChild as HTMLTableCellElement;
        td0.setAttribute("rowspan", "0");
        const addSpanClone = addSpan.cloneNode(true) as HTMLSpanElement;
        td0.appendChild(addSpanClone);
        addSpanClone.addEventListener("click", () => {
          copyTextToClipboard(tbody.dataset.addedText ?? "UNKNOWN CODE SORRY");
          addSpanClone.innerText = "✓";
          setTimeout(() => {
            addSpanClone.innerText = "+";
          }, 800);
        });
        firstRow = false;
      } else {
        tr.removeChild(tr.firstChild!);
      }
    });
  });

  table.querySelectorAll("tbody.diff-del").forEach((tbody) => {
    let firstRow = true;
    tbody.querySelectorAll("tr").forEach((tr) => {
      if (firstRow) {
        let td0 = tr.firstChild as HTMLTableCellElement;
        td0.setAttribute("rowspan", "0");
        td0.innerHTML = "";
        td0.insertBefore(delSpan.cloneNode(true), null);
        firstRow = false;
      } else {
        tr.removeChild(tr.firstChild!);
      }
    });
  });

  return table;
};

/** Search for a row with non-empty content within a tbody of the given
 * class.  If found, wrap in a <tbody> and a <table>.  Otherwise, null.
 * */
const diffSampleOfClass = (
  tables: Array<HTMLTableElement>,
  cls: string
): HTMLTableElement | null => {
  let maybeSampleRow: HTMLTableRowElement | null = null;

  tables.forEach((table) => {
    // This is fiddly.  We need to save the first row of the tbody
    // because we only show one [-] or [+] sign spanning the full set of
    // rows, so the row providing the content might only have one cell.
    let firstRow: HTMLTableRowElement | null = null;
    table.querySelectorAll(`tbody.${cls} tr`).forEach((row) => {
      firstRow ??= row as HTMLTableRowElement;
      const mCell = row.querySelector("td.code-text pre");
      if (mCell != null) {
        const text = mCell.textContent || "";
        if (text.length !== 0) {
          if (maybeSampleRow == null) {
            maybeSampleRow = firstRow.cloneNode(true) as HTMLTableRowElement;
            maybeSampleRow.removeChild(maybeSampleRow.lastChild!);
            maybeSampleRow.appendChild(mCell.parentElement!.cloneNode(true));
          }
        }
      }
    });
  });

  if (maybeSampleRow == null) return null;

  // Not sure why TS doesn't work this out?
  const sampleRow = maybeSampleRow as unknown as HTMLTableRowElement;
  const mCopyDiv = sampleRow.querySelector("div.copy-button");
  if (mCopyDiv != null) {
    let parent = failIfNull(mCopyDiv.parentNode, "no parent found");
    parent.removeChild(mCopyDiv);
  }

  let tableSection = document.createElement("tbody");
  tableSection.classList.add(cls);
  tableSection.appendChild(maybeSampleRow);

  let table = document.createElement("table");
  table.appendChild(tableSection);
  return table;
};

const diffSamples = (tables: Array<HTMLTableElement>): DiffHelpSamples => {
  return {
    unchanged: diffSampleOfClass(tables, "diff-unch"),
    deleted: diffSampleOfClass(tables, "diff-del"),
    added: diffSampleOfClass(tables, "diff-add"),
  };
};

const nAddHunks = (tables: Array<HTMLTableElement>): number => {
  return tables
    .map((table) => table.querySelectorAll("tbody.diff-add").length)
    .reduce((a, x) => a + x, 0);
};

const TutorialPatchElement = ({ div }: TutorialPatchElementProps) => {
  const runCodeDiffHelp = useRunFlow((f) => f.codeDiffHelpFlow);

  let divCopy = div.cloneNode(true) as HTMLDivElement;

  const tableElts = Array.from(
    divCopy.querySelectorAll("div.patch table")
  ) as Array<HTMLTableElement>;

  if (tableElts.length === 0) {
    // Maybe this is a warning, e.g., for slug-not-found?  Don't crash,
    // anyway.
    console.log("TutorialPatchElement: no 'div.patch table'", div);
    return <RawElement element={div} />;
  }

  // The following loop modifies in-place the passed-in "table" argument.
  const patchDivs = tableElts.map((table, idx) => {
    showLeadingSpaces(table);
    insertAddAndDelSymbols(table);
    return <RawElement key={idx} className="patch" element={table} />;
  });

  const contentDivs = patchDivs
    .map((div, idx) => [
      ...(idx > 0 ? [<VerticalEllipsis key={`ellip-${idx}`} />] : []),
      [div],
    ])
    .flat(1);

  const samples = diffSamples(tableElts);

  // TODO: This is too clumsy really.  If a tutorial genuinely contains
  // a "·" character (in a literal string, perhaps), then it will be
  // replaced.  To do this properly might require looking at DOM and
  // seeing which "·" characters are inside a visible-leading-spaces
  // span, and only replacing them.  In fact, the replacement of leading
  // spaces with "·" characters is only heuristic; e.g., it will behave
  // incorrectly in the case of spaces inside multi-line strings.
  //
  const convertDotsToSpaces: ClipboardEventHandler = (event) => {
    const selection = document.getSelection();
    if (selection == null) {
      console.warn("selection null inside 'copy' handler");
    } else {
      const rawCopiedText = selection.toString();
      const convertedCopiedText = rawCopiedText.replaceAll("·", " ");
      event.clipboardData.setData("text/plain", convertedCopiedText);
      event.preventDefault();
    }
  };

  const nAdds = nAddHunks(tableElts);
  const mHintDiv =
    nAdds === 0 ? (
      false
    ) : nAdds === 1 ? (
      <div className="copy-hint">
        <p>
          Hint: Click on the <span className="add-code-icon">+</span> button to
          copy the new code.
        </p>
      </div>
    ) : (
      <div className="copy-hint">
        <p>
          Hint: Click on a <span className="add-code-icon">+</span> button to
          copy that chunk of new code.
        </p>
      </div>
    );

  return (
    <div className="patch-container" onCopy={convertDotsToSpaces}>
      <div className="header">
        <h1 className="decoration">Change the code like this:</h1>
        <Button onClick={() => runCodeDiffHelp({ samples })}>
          <FontAwesomeIcon icon="question-circle" />
        </Button>
      </div>
      <div className="patch-contents">{contentDivs}</div>
      {mHintDiv}
    </div>
  );
};

const TutorialChapter = () => {
  const lastRenderedChapter = useRef<number>(-1);

  const maybeTrackedTutorial = useStoreState(
    (state) => state.activeProject.project?.trackedTutorial
  );
  const navigateToChapter = useStoreActions(
    (actions) => actions.activeProject.setActiveTutorialChapter
  );

  const trackedTutorial = failIfNull(
    maybeTrackedTutorial,
    "no tracked tutorial"
  );

  // Under normal use, the activeChapterIndex will always be valid.
  // However, when a tutorial author is using live-reload, the
  // activeChapterIndex might be beyond the end of the tutorial as it
  // currently is served by the tutorial server.  This then leads to a
  // crash when re-opening the project.  Guard against this.
  const allChapters = trackedTutorial.content.chapters;
  const rawChapterIndex = trackedTutorial.activeChapterIndex;
  const maxValidIndex = allChapters.length - 1;
  const chapterIndex = Math.min(rawChapterIndex, maxValidIndex);
  const activeChapter = allChapters[chapterIndex];

  if (chapterIndex !== lastRenderedChapter.current) {
    if (lastRenderedChapter.current !== -1) {
      setTimeout(focusChapterContent);
    }
    lastRenderedChapter.current = chapterIndex;
  }

  const navigateToChapterFun = (chapterIndex: number) => () =>
    navigateToChapter(chapterIndex);

  let navigationButtonsProps: ChapterNavigationButtonsProps = {};
  if (activeChapter.maybePrevTitle != null)
    navigationButtonsProps.prev = {
      displayTitle: activeChapter.maybePrevTitle,
      navigate: navigateToChapterFun(chapterIndex - 1),
    };
  if (activeChapter.maybeNextTitle != null)
    navigationButtonsProps.next = {
      displayTitle: activeChapter.maybeNextTitle,
      navigate: navigateToChapterFun(chapterIndex + 1),
    };

  // Discard the first item in contentElements, which is the heading
  // element.  The chapter title is already shown in the header bar
  // (progress trail).
  const contentBodyElements = activeChapter.contentElements.slice(1);

  return (
    <div className="TutorialChapter-scrollable">
      <div className="TutorialChapter-container">
        <div className="TutorialChapter" tabIndex={-1}>
          {contentBodyElements.map((element, idx) => (
            <TutorialElement key={idx} element={element} />
          ))}
          <ChapterNavigationButtons {...navigationButtonsProps} />
        </div>
      </div>
    </div>
  );
};

const ActiveTutorial = () => {
  //
  // TODO: Review the nested structure and simplify if possible.  Also
  // change class names to reflect fact that they no longer apply to
  // just "per-method lessons".
  //
  // TODO: Implement scrolling behaviour whereby scroll position is
  // preserved within a chapter but reset when moving to another
  // chapter.

  const chapterContainerRef: React.RefObject<HTMLDivElement> = createRef();
  const chapterIndex = useMappedTrackedTutorial(
    (tutorial) => tutorial.activeChapterIndex
  );

  return (
    <div className="Junior-LessonContent-container">
      <WidthMonitor nonStageWd={1100} />
      <div className="Junior-LessonContent-HeaderBar">
        <ProgressTrail.Flat />
      </div>
      <div className="Junior-LessonContent-inner-container">
        <div
          ref={chapterContainerRef}
          className="Junior-LessonContent abs-0000-oflow"
          tabIndex={0}
        >
          <div className="content">
            <TutorialChapter />
          </div>
        </div>
        <DivScroller
          pageKey={chapterIndex}
          containerDivRef={chapterContainerRef}
        />
      </div>
    </div>
  );
};

const Tutorial = () => {
  const loadState = useStoreState(
    (state) => state.activeProject.syncState.loadState
  );

  switch (loadState) {
    case "failed":
      return <div>Error loading tutorial.</div>;
    case "pending":
      return <div>Loading...</div>;
    case "succeeded":
      return <ActiveTutorial />;
    default:
      return assertNever(loadState);
  }
};

export default Tutorial;
