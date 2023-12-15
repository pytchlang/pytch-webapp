import React from "react";
import classNames from "classnames";
import { useLinkedJrTutorial } from "./hooks";
import { EmptyProps, range } from "../../../utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type ProgressTrailNodeProps = { idx: number; currentIdx: number };
const ProgressTrailNode: React.FC<ProgressTrailNodeProps> = (props) => {
  const kind =
    props.idx < props.currentIdx
      ? "completed"
      : props.idx === props.currentIdx
      ? "current"
      : "future";

  const nodeClasses = classNames("progress-node", kind);
  const objContent =
    kind === "completed" ? (
      <span>
        <FontAwesomeIcon icon="check"></FontAwesomeIcon>
      </span>
    ) : kind === "future" ? (
      <div></div>
    ) : null;

  return <div className={nodeClasses}>{objContent}</div>;
};

export const ProgressTrail: React.FC<EmptyProps> = () => {
  const linkedTutorial = useLinkedJrTutorial();
  const activeChapterIndex = linkedTutorial.interactionState.chapterIndex;

  // Only some of the chapters count as "progress stages".  (We might
  // exclude the "Challenges" and "Asset credits" chapters, for
  // example.)
  const progressStages = linkedTutorial.content.chapters.filter(
    (chap) => chap.includeInProgressTrail
  );
  const nProgressStages = progressStages.length;

  const chapterTitleElt =
    linkedTutorial.content.chapters[activeChapterIndex].chunks[0];
  if (chapterTitleElt.kind !== "element") {
    throw new Error("first chunk is not element");
  }

  const nodeDivs = range(nProgressStages).map((idx) => (
    <ProgressTrailNode key={idx} idx={idx} currentIdx={activeChapterIndex} />
  ));

  const maybeChapterNumberLabel =
    activeChapterIndex > 0 ? (
      <span className="chapter-number">{activeChapterIndex} —</span>
    ) : null;

  return (
    <>
      <div className="ProgressTrail">
        <div className="track" />
        <div className="nodes">{nodeDivs}</div>
      </div>
      <div className="chapter-title">{chapterTitleElt.element.innerText}</div>
    </>
  );
};
