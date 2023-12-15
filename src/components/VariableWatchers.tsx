import React from "react";
import { useStoreState } from "../store";

import { AttributeWatcherRenderInstruction } from "../skulpt-connection/render-instructions";
import {
  stageHalfHeight,
  stageHalfWidth,
  stageHeight,
  stageWidth,
} from "../constants";
import { eqDisplaySize } from "../model/ui";

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

export const VariableWatchers = () => {
  const displaySize = useStoreState(
    (state) => state.ideLayout.stageDisplaySize,
    eqDisplaySize
  );
  const watchers = useStoreState((state) => state.variableWatchers.watchers);

  const sizeStyle = {
    width: `${displaySize.width}px`,
    height: `${displaySize.height}px`,
  };

  const scaleX = displaySize.width / stageWidth;
  const scaleY = displaySize.height / stageHeight;
  const scaleProps = { scaleX, scaleY };

  // The variable watchers do have a "key" property, but eslint doesn't
  // spot this.
  return (
    <div id="pytch-attribute-watchers" style={sizeStyle}>
      {watchers.map((w) => (
        /* eslint-disable-next-line react/jsx-key */
        <VariableWatcher {...w} {...scaleProps} />
      ))}
    </div>
  );
};
