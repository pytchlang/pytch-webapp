import React, {
  ClipboardEventHandler,
  createRef,
  useEffect,
  useRef,
} from "react";
import { useStoreState, useStoreActions } from "../store";
import RawElement from "./RawElement";
import Button from "react-bootstrap/Button";
import { assertNever, failIfNull, isDivOfClass } from "../utils";
import { IDiffHelpSamples } from "../model/user-interactions/code-diff-help";
import { makeScratchSVG } from "../model/scratchblocks-render";

import "../pytch-tutorial.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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
    const sbSvg = makeScratchSVG(element.innerText, 1.0);
    return <RawElement className="scratchblocks" element={sbSvg} />;
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

/* Modifies the passed-in element; returns array of tables found. */
const addCopyButtons = (div: HTMLDivElement): Array<HTMLTableElement> => {
  const tableElements = div.querySelectorAll("div.patch table");
  tableElements.forEach((tableElement) => {
    const table = tableElement as HTMLTableElement;

    let tbodyAddElts = table.querySelectorAll("tbody.diff-add");

    tbodyAddElts.forEach((tbodyElement) => {
      const tbody = tbodyElement as HTMLTableSectionElement;
      let copyButton = document.createElement("div");
      copyButton.className = "copy-button";
      copyButton.innerHTML =
        '<p class="content">COPY</p><p class="feedback">✓&nbsp;Copied!</p>';
      copyButton.onclick = async (evt: MouseEvent) => {
        console.log(evt);
        const pContent = evt.target as HTMLElement;
        const parentElement = failIfNull(pContent.parentElement, "no parent");
        parentElement.querySelectorAll("p").forEach((node) => {
          const elt = node as HTMLParagraphElement;
          elt.classList.add("active");
          elt.addEventListener("animationend", () => {
            elt.classList.remove("active");
          });
        });
        try {
          const text = tbody.dataset.addedText;
          if (text != null) {
            await navigator.clipboard.writeText(text);
          }
        } catch (err) {
          console.log(
            "Could not copy to clipboard",
            "(an error is expected if running under Cypress):",
            err
          );
        }
      };

      let topRightCell = failIfNull(
        tbody.querySelector("tr > td:last-child"),
        "top-right cell not found"
      );
      topRightCell.appendChild(copyButton);
    });
  });

  return Array.from(tableElements) as Array<HTMLTableElement>;
};

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
  let addSpan = document.createElement("span");
  addSpan.classList.add("add-or-del");
  addSpan.innerText = "+";
  let delSpan = document.createElement("span");
  delSpan.classList.add("add-or-del");
  delSpan.innerText = "−";

  console.log("add", addSpan);
  table.querySelectorAll("tbody.diff-add tr td:first-child").forEach((td) => {
    td.insertBefore(addSpan.cloneNode(true), td.firstChild);
  });
  console.log("add", addSpan);
  table.querySelectorAll("tbody.diff-del tr td:nth-child(2)").forEach((td) => {
    td.insertBefore(delSpan.cloneNode(true), td.firstChild);
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
    table.querySelectorAll(`tbody.${cls} tr`).forEach((row) => {
      const mCell = row.querySelector("td:nth-child(3) pre");
      if (mCell != null) {
        const text = mCell.textContent || "";
        if (text.length !== 0) {
          if (maybeSampleRow == null) {
            maybeSampleRow = row.cloneNode(true) as HTMLTableRowElement;
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

const diffSamples = (tables: Array<HTMLTableElement>): IDiffHelpSamples => {
  return {
    unchanged: diffSampleOfClass(tables, "diff-unch"),
    deleted: diffSampleOfClass(tables, "diff-del"),
    added: diffSampleOfClass(tables, "diff-add"),
  };
};

const TutorialPatchElement = ({ div }: TutorialPatchElementProps) => {
  const showHelp = useStoreActions(
    (actions) => actions.userConfirmations.codeDiffHelpInteraction.launch
  );

  let divCopy = div.cloneNode(true) as HTMLDivElement;

  const tableElts = addCopyButtons(divCopy);

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

  return (
    <div className="patch-container" onCopy={convertDotsToSpaces}>
      <div className="header">
        <h1 className="decoration">Change the code like this:</h1>
        <Button onClick={() => showHelp(samples)}>
          <FontAwesomeIcon icon="question-circle" />
        </Button>
      </div>
      {contentDivs}
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
            {activeChapter.maybeNextTitle &&
              !activeChapter.hasRunProjectMarker && (
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
  const loadState = useStoreState(
    (state) => state.activeProject.syncState.loadState
  );

  switch (loadState) {
    case "failed":
      return <div>Error loading tutorial.</div>;
    case "pending":
      return <div>Loading...</div>;
    case "succeeded":
      // Fall through to handle these cases.
      break;
    default:
      throw new Error(`unknown loadState "${loadState}"`);
  }

  return (
    <div className="tutorial-pane">
      <TutorialTableOfContents />
      <TutorialChapter />
    </div>
  );
};

export default Tutorial;
