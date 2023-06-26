import React from "react";
import { assertNever } from "../utils";
import { PointerStagePosition } from "../model/ui";

const coordsOrPlaceholderSpan = (position: PointerStagePosition) => {
  switch (position.kind) {
    case "not-over-stage":
      return (
        <span className="coords spacer">
          <code>(+999, +999)</code>
        </span>
      );
    case "over-stage": {
      const asStr = (n: number) => n.toString().padStart(4, "   ");
      const xStr = asStr(position.stageX);
      const yStr = asStr(position.stageY);
      return (
        <span className="coords">
          <code>
            ({xStr}, {yStr})
          </code>
        </span>
      );
    }
    default:
      return assertNever(position);
  }
};
