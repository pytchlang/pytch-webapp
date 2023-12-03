import React from "react";
import classNames from "classnames";
import { PrettyPrintedLine } from "../../../../model/code-diff";
import RawElement from "../../../RawElement";
import { assertNever } from "../../../../utils";

type DiffViewKind = "bare-old" | "old-diff" | "new-diff";
type ScriptDiffLine = PrettyPrintedLine<HTMLElement>;

type DiffViewKindSelectorProps = {
  viewKind: DiffViewKind;
  setViewKind: (kind: DiffViewKind) => void;
};
const DiffViewKindSelector: React.FC<DiffViewKindSelectorProps> = ({
  viewKind,
  setViewKind,
}) => {
  const viewOption = (
    activeViewKind: DiffViewKind,
    thisViewKind: DiffViewKind,
    label: string
  ) => {
    const isActive = activeViewKind === thisViewKind;
    const classes = classNames("DiffViewKindOption", { isActive });
    return (
      <div className={classes} onClick={() => setViewKind(thisViewKind)}>
        <span>{label}</span>
      </div>
    );
  };

  return (
    <div className="DiffViewKindSelector">
      {viewOption(viewKind, "bare-old", "What should my code look like now?")}
      {viewOption(viewKind, "old-diff", "Where should I change my code?")}
      {viewOption(
        viewKind,
        "new-diff",
        "What should my code look like afterwards?"
      )}
    </div>
  );
};

type ScriptDiffViewLineProps = { line: ScriptDiffLine };
const ScriptDiffViewLine: React.FC<ScriptDiffViewLineProps> = ({ line }) => {
  switch (line.kind) {
    case "context":
    case "change":
    case "add":
    case "del":
      // HTMLElement instances cannot appear multiple times in the DOM,
      // so give a clone of the rich line's element to <RawElement>.
      return (
        <div className={line.kind}>
          <pre className="lineno">
            <code>{line.lineNumber}</code>
          </pre>
          <RawElement element={line.richLine.cloneNode(true) as HTMLElement} />
        </div>
      );
    case "add-padding":
    case "change-padding":
    case "del-padding":
      return (
        <div className={line.kind}>
          <pre className="lineno" />
          <div>
            <pre>
              <code>{line.helpText}</code>
            </pre>
          </div>
        </div>
      );
    default:
      return assertNever(line);
  }
};
