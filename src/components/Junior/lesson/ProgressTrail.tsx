import React from "react";
import classNames from "classnames";
import { useLinkedJrTutorial } from "./hooks";
import { EmptyProps, failIfNull, range } from "../../../utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import RawElement from "../../RawElement";
import { useStoreActions, useStoreState } from "../../../store";

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
  nodeKindFromIndex: (idx: number) => LabelledProgressNodeKind
): Array<ProgressNodeDescriptor> {
  const mkLabelled = (nodeIdx: number): ProgressNodeDescriptor => ({
    key: `labelled-${nodeIdx}`,
    kind: nodeKindFromIndex(nodeIdx),
    index: nodeIdx,
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
    nodeKindFromIndex
  );

  const nodeDivs = nodeDescriptors.map((d) => (
    <ProgressTrailNode key={d.key} descriptor={d} />
  ));

  const maybeChapterNumberLabel = activeChapterIndex > 0 && (
    <span className="chapter-number">{activeChapterIndex} —</span>
  );

  const nodeBackgrounds = nodeDescriptors.map((d, idx) => {
    const isActive = d.kind !== "ellipsis" && d.index === activeChapterIndex;
    const classes = classNames("progress-node-background", { isActive });
    return <div key={idx} className={classes} />;
  });

  const nodeHoverTargets = nodeDescriptors.map((d, displayedIdx) => {
    if (d.kind === "ellipsis") {
      return (
        <div
          key={`ellipsis-${displayedIdx}`}
          className="progress-node-no-hover"
        />
      );
    }

    const canJumpHere = canJumpHereFromIndex(d.index);
    const contentElt = cloneChapterTitleElt(d.index);

    const tooltip = (
      <div className="progress-node-tooltip">
        {!canJumpHere && <FontAwesomeIcon className="locked" icon="lock" />}
        <RawElement element={contentElt} />
      </div>
    );

    const onClick = canJumpHere ? () => setChapterIndex(d.index) : () => void 0;
    const classes = classNames("progress-node-hover-target", { canJumpHere });

    return (
      <div
        key={`labelled-${displayedIdx}`}
        data-chapter-index={`${d.index}`}
        className={classes}
        onClick={onClick}
      >
        {tooltip}
      </div>
    );
  });

  return (
    <>
      <div className="ProgressTrail">
        <div className="node-backgrounds">{nodeBackgrounds}</div>
        <div className="track" />
        <div className="nodes">{nodeDivs}</div>
        <div className="node-hover-targets">{nodeHoverTargets}</div>
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
