import React, { useEffect } from "react";
import classNames from "classnames";
import { useLinkedJrTutorial } from "./hooks";
import {
  EmptyProps,
  failIfNull,
  mDataAttrIntValue,
  range,
} from "../../../utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import RawElement from "../../RawElement";
import { useStoreActions, useStoreState } from "../../../store";
import { kFocusGroupItemClassName } from "../../../model/junior/grouped-focus";
import { useFocusContext } from "../../hooks/focus-steering";
import { FocusGroupContainer } from "../../FocusGroupContainer";

type LabelledProgressNodeKind = "normal" | "inverse";
type ProgressNodeKind = "ellipsis" | LabelledProgressNodeKind;

type LabelledProgressNodeDescriptor = {
  kind: "normal" | "inverse";
  index: number;
  jumpable: boolean;
};

type ProgressNodeDescriptor = { kind: ProgressNodeKind; key: string } & (
  | LabelledProgressNodeDescriptor
  | { kind: "ellipsis"; jumpable: false }
);

// This is labouring the point a bit, but allows TypeScript to infer
// types through filter(canJumpToNode).
//
type JumpableProgressNodeDescriptor = ProgressNodeDescriptor & {
  jumpable: true;
};
//
function canJumpToNode(
  node: ProgressNodeDescriptor
): node is JumpableProgressNodeDescriptor {
  return node.jumpable;
}

const kFocusGroupKey = "ProgressTrail";

function mChapterIndexFromElt(elt: HTMLElement) {
  const mStrChapterIndex = elt.dataset.chapterIndex;
  const mChapterIndex = parseInt(mStrChapterIndex ?? "");
  if (isNaN(mChapterIndex)) {
    console.warn(
      `ProgressTrail: Bad chapter-index data attr "${mStrChapterIndex}"`
    );
    return null;
  }

  return mChapterIndex;
}

function mJumpableNodeIndexForChapter(
  nodes: Array<ProgressNodeDescriptor>,
  targetIndex: number
) {
  const eltIndex = nodes
    .filter(canJumpToNode)
    .findIndex((nd) => nd.index === targetIndex);

  if (eltIndex === -1) {
    console.warn(`ProgressTrail: No jumpable node for chapter ${targetIndex}`);
    return null;
  }

  return eltIndex;
}

type ProgressTrailNodeProps = { descriptor: ProgressNodeDescriptor };
const ProgressTrailNode: React.FC<ProgressTrailNodeProps> = ({
  descriptor,
}) => {
  const nodeClasses = classNames("progress-node", `kind-${descriptor.kind}`);
  const content =
    descriptor.kind === "ellipsis" ? (
      <>
        <div className="ellipsis-dot" />
        <div className="ellipsis-dot" />
        <div className="ellipsis-dot" />
      </>
    ) : (
      <span className="progress-node-label">{descriptor.index}</span>
    );
  return <div className={nodeClasses}>{content}</div>;
};

function ellipsisDescriptor(index: number): ProgressNodeDescriptor {
  return { kind: "ellipsis", key: `ellipsis-${index}`, jumpable: false };
}

const kVisibleProgressNodes = 9;
const kCentralNodeRangeHalfWidth = 2;
const kCentralProgressNodes = 1 + 2 * kCentralNodeRangeHalfWidth;

function progressNodeDescriptors(
  nTotalNodes: number,
  activeNodeIndex: number,
  nodeKindFromIndex: (idx: number) => LabelledProgressNodeKind,
  canJumpHereFromIndex: (idx: number) => boolean
): Array<ProgressNodeDescriptor> {
  const mkLabelled = (nodeIdx: number): ProgressNodeDescriptor => ({
    key: `labelled-${nodeIdx}`,
    kind: nodeKindFromIndex(nodeIdx),
    index: nodeIdx,
    jumpable: canJumpHereFromIndex(nodeIdx),
  });

  const lastIdx = nTotalNodes - 1;

  if (nTotalNodes <= kVisibleProgressNodes) {
    return range(nTotalNodes).map(mkLabelled);
  }

  if (activeNodeIndex < kCentralProgressNodes) {
    return [
      ...range(kCentralProgressNodes + 2).map(mkLabelled),
      ellipsisDescriptor(1),
      mkLabelled(lastIdx),
    ];
  }

  if (activeNodeIndex >= nTotalNodes - kCentralProgressNodes) {
    const tailStartIdx = nTotalNodes - kCentralProgressNodes - 2;
    return [
      mkLabelled(0),
      ellipsisDescriptor(0),
      ...range(tailStartIdx, nTotalNodes).map(mkLabelled),
    ];
  }

  const centralIdx0 = activeNodeIndex - kCentralNodeRangeHalfWidth;
  const centralIdx1 = activeNodeIndex + kCentralNodeRangeHalfWidth + 1;
  return [
    mkLabelled(0),
    ellipsisDescriptor(0),
    ...range(centralIdx0, centralIdx1).map(mkLabelled),
    ellipsisDescriptor(1),
    mkLabelled(lastIdx),
  ];
}

type ProgressCoreNodesProps = {
  nodeDescriptors: Array<ProgressNodeDescriptor>;
};
const ProgressCoreNodes: React.FC<ProgressCoreNodesProps> = ({
  nodeDescriptors,
}) => {
  const nodeDivs = nodeDescriptors.map((d) => (
    <ProgressTrailNode key={d.key} descriptor={d} />
  ));

  return <div className="nodes">{nodeDivs}</div>;
};

type ProgressNodeHoverTargetsProps = ProgressCoreNodesProps &
  Pick<
    GenericProgressTrailProps,
    "activeChapterIndex" | "setChapterIndex" | "cloneChapterTitleElt"
  >;
const ProgressNodeHoverTargets: React.FC<ProgressNodeHoverTargetsProps> = ({
  nodeDescriptors,
  activeChapterIndex,
  setChapterIndex,
  cloneChapterTitleElt,
}) => {
  const focusContext = useFocusContext();

  const maxJumpableChapterIndex =
    nodeDescriptors.findLast(canJumpToNode)?.index;

  const nodeHoverTargets = nodeDescriptors.map((d, displayedIdx) => {
    if (d.kind === "ellipsis") {
      return (
        <div
          key={`ellipsis-${displayedIdx}`}
          className="progress-node-no-hover"
        />
      );
    }

    const canJumpHere = d.jumpable;
    const contentElt = cloneChapterTitleElt(d.index);

    const tooltip = (
      <div className="progress-node-tooltip">
        {!canJumpHere && <FontAwesomeIcon className="locked" icon="lock" />}
        <RawElement element={contentElt} />
      </div>
    );

    const onClick = canJumpHere ? () => setChapterIndex(d.index) : () => void 0;
    const classes = classNames(
      canJumpHere && kFocusGroupItemClassName,
      "progress-node-hover-target",
      { canJumpHere }
    );

    // The tab-index attribute is modified outside React, by the
    // focus-group machinery.  Sometimes a node changes whether it's
    // jumpable (when the user marks the last task in a chapter as
    // done/not-yet-done).  When rendering, force all tab-index to -1.
    //
    // It is not enough to specify tabIndex={-1} in the <div>, I think
    // because React doesn't realise it might have changed, and so
    // doesn't update the real DOM.
    function forceTabIndex(elt: HTMLElement | null) {
      if (elt != null) {
        elt.tabIndex = -1;
      }
    }

    return (
      <div
        ref={forceTabIndex}
        key={`labelled-${displayedIdx}`}
        data-chapter-index={`${d.index}`}
        className={classes}
        onClick={onClick}
        aria-label={`Chapter ${d.index}`}
      >
        {tooltip}
      </div>
    );
  });

  // If the user changes chapter by activating the focus-group item,
  // then focus (and hence the bookmark) is already correct.  But in
  // this case, the user can also change chapter by clicking the "next
  // chapter" button at the bottom of the a chapter's content.  In that
  // case we must manually update the focus-group bookmark.
  useEffect(() => {
    const mEltIndex = mJumpableNodeIndexForChapter(
      nodeDescriptors,
      activeChapterIndex
    );
    if (mEltIndex != null) {
      // Set bookmark *after* ProgressTrail has rendered.
      setTimeout(() => {
        focusContext.bookmarkItemByKeyAndIndex(kFocusGroupKey, mEltIndex);
      });
    }
  }, [activeChapterIndex]);

  // Handle the sequence of events where the user:
  //
  // * has one task yet to do within the active chapter;
  // * marks that last task as done;
  // * uses shift-tab to bring focus back to that chapter's node;
  // * presses right-arrow (or down-arrow, or end) to move focus to the
  //   just-made-jumpable node for the next chapter;
  // * uses tab to bring focus to the "rewind" button of the last task
  //   in the active chapter;
  // * presses space to mark that task as no longer done;
  // * uses shift-tab to bring focus back to the progress trail.
  //
  // We need to make sure that the bookmarked node within the progress
  // trail is updated when a node becomes no longer an item with the
  // group.  We watch the maximum jumpable chapter index, and ensure the
  // bookmark is valid.
  useEffect(() => {
    focusContext.ensureBookmarkInRange(
      kFocusGroupKey,
      (elt) => mDataAttrIntValue(elt, "chapterIndex") === activeChapterIndex
    );
  }, [maxJumpableChapterIndex]);

  function onActivate(elt: HTMLElement) {
    const mChapterIndex = mDataAttrIntValue(elt, "chapterIndex");
    if (mChapterIndex != null) {
      setChapterIndex(mChapterIndex);
    }
  }

  return (
    <FocusGroupContainer
      className="node-hover-targets"
      groupedFocusKey={kFocusGroupKey}
      opts={{ onActivate }}
    >
      {nodeHoverTargets}
    </FocusGroupContainer>
  );
};

type GenericProgressTrailProps = {
  nProgressStages: number;
  activeChapterIndex: number;
  setChapterIndex(idx: number): void;
  nodeKindFromIndex(idx: number): LabelledProgressNodeKind;
  cloneChapterTitleElt(idx: number): HTMLElement;
  canJumpHereFromIndex(idx: number): boolean;
};
const GenericProgressTrail: React.FC<GenericProgressTrailProps> = ({
  nProgressStages,
  activeChapterIndex,
  setChapterIndex,
  nodeKindFromIndex,
  cloneChapterTitleElt,
  canJumpHereFromIndex,
}) => {
  const chapterTitleElt = cloneChapterTitleElt(activeChapterIndex);

  const nodeDescriptors = progressNodeDescriptors(
    nProgressStages,
    activeChapterIndex,
    nodeKindFromIndex,
    canJumpHereFromIndex
  );

  const maybeChapterNumberLabel = activeChapterIndex > 0 && (
    <span className="chapter-number">{activeChapterIndex} —</span>
  );

  const nodeBackgrounds = nodeDescriptors.map((d, idx) => {
    const isActive = d.kind !== "ellipsis" && d.index === activeChapterIndex;
    const classes = classNames("progress-node-background", { isActive });
    return <div key={idx} className={classes} />;
  });

  return (
    <>
      <div className="ProgressTrail">
        <div className="node-backgrounds">{nodeBackgrounds}</div>
        <div className="track" />
        <ProgressCoreNodes {...{ nodeDescriptors }} />
        <ProgressNodeHoverTargets
          {...{
            nodeDescriptors,
            activeChapterIndex,
            setChapterIndex,
            cloneChapterTitleElt,
            canJumpHereFromIndex,
          }}
        />
      </div>
      <div className="chapter-title">
        {maybeChapterNumberLabel}
        {chapterTitleElt.innerText}
      </div>
    </>
  );
};

const ProgressTrail_PerMethod: React.FC<EmptyProps> = () => {
  const linkedTutorial = useLinkedJrTutorial();
  const allowRandomChapterAccess = useStoreState(
    (state) => state.tutorialCollection.allowRandomChapterAccess
  );
  const setChapterIndex = useStoreActions(
    (actions) => actions.activeProject.setLinkedLessonChapterIndex
  );

  const tutorialContent = linkedTutorial.content;
  const chapters = tutorialContent.chapters;

  // Only some of the chapters count as "progress stages".  (We might
  // exclude the "Challenges" and "Asset credits" chapters, for
  // example.)
  const progressStages = chapters.filter((chap) => chap.includeInProgressTrail);
  const nProgressStages = progressStages.length;

  const activeChapterIndex = linkedTutorial.interactionState.chapterIndex;

  function nodeKindFromIndex(idx: number): LabelledProgressNodeKind {
    const nTasksInclChapter = tutorialContent.nTasksBeforeChapter[idx + 1];
    const nTasksDone = linkedTutorial.interactionState.nTasksDone;
    return nTasksDone >= nTasksInclChapter ? "inverse" : "normal";
  }

  function cloneChapterTitleElt(idx: number) {
    return chapters[idx].titleElt.cloneNode(true) as HTMLElement;
  }

  function canJumpHereFromIndex(idx: number) {
    const nTasksBeforeChapter = tutorialContent.nTasksBeforeChapter[idx];
    const nTasksDone = linkedTutorial.interactionState.nTasksDone;
    return nTasksDone >= nTasksBeforeChapter || allowRandomChapterAccess;
  }

  const props: GenericProgressTrailProps = {
    nProgressStages,
    activeChapterIndex,
    setChapterIndex,
    nodeKindFromIndex,
    cloneChapterTitleElt,
    canJumpHereFromIndex,
  };

  return <GenericProgressTrail {...props} />;
};

const ProgressTrail_Flat: React.FC<EmptyProps> = () => {
  const maybeTutorial = useStoreState(
    (state) => state.activeProject.project?.trackedTutorial
  );
  const setChapterIndex = useStoreActions(
    (actions) => actions.activeProject.setActiveTutorialChapter
  );
  const tutorial = failIfNull(maybeTutorial, "no tutorial to construct ToC");

  const nProgressStages = tutorial.content.chapters.length;
  const activeChapterIndex = tutorial.activeChapterIndex;

  function nodeKindFromIndex(_idx: number): LabelledProgressNodeKind {
    return "normal";
  }

  function cloneChapterTitleElt(idx: number) {
    // Hm; bit of a fudge:
    let h2Elt = document.createElement("h2");
    h2Elt.textContent = tutorial.content.chapters[idx].title;
    return h2Elt;
  }

  function canJumpHereFromIndex(_idx: number) {
    return true;
  }

  const props: GenericProgressTrailProps = {
    nProgressStages,
    activeChapterIndex,
    setChapterIndex,
    nodeKindFromIndex,
    cloneChapterTitleElt,
    canJumpHereFromIndex,
  };

  return <GenericProgressTrail {...props} />;
};

export const ProgressTrail = {
  PerMethod: ProgressTrail_PerMethod,
  Flat: ProgressTrail_Flat,
};
