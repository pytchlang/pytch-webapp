import React from "react";

import { AttributeWatcherRenderInstruction } from "../skulpt-connection/render-instructions";
import {
  stageHalfHeight,
  stageHalfWidth,
} from "../constants";

type StageScale = {
  scaleX: number;
  scaleY: number;
};

const VariableWatcher: React.FC<
  AttributeWatcherRenderInstruction & StageScale
> = (props) => {
  let style = Object();
  if (props.position[0] != null) {
    const topOffset = props.scaleY * (stageHalfHeight - props.position[0]);
    style.top = `${topOffset}px`;
  } else if (props.position[2] != null) {
    const bottomOffset = props.scaleY * (props.position[2] + stageHalfHeight);
    style.bottom = `${bottomOffset}px`;
  } else {
    // TODO: Error?
  }
  if (props.position[3] != null) {
    const leftOffset = props.scaleX * (props.position[3] + stageHalfWidth);
    style.left = `${leftOffset}px`;
  } else if (props.position[1] != null) {
    const rightOffset = props.scaleX * (stageHalfWidth - props.position[1]);
    style.right = `${rightOffset}px`;
  } else {
    // TODO: Error?
  }

  return (
    <div className="attribute-watcher" style={style}>
      <span className="label">{props.label}</span>
      <span className="value">{props.value}</span>
    </div>
  );
};
