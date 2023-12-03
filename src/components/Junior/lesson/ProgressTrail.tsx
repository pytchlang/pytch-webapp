import React from "react";
import classNames from "classnames";
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
