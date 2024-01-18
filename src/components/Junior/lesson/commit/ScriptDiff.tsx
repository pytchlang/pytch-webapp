import React, { useState } from "react";
import classNames from "classnames";
import {
  DiffViewKind,
  EnrichedDiff,
  PrettyPrintedLine,
} from "../../../../model/code-diff";
import { DisplayHatBlock } from "../../HatBlock";
import {
  ActorKind,
  EventDescriptor,
} from "../../../../model/junior/structured-program";
import { getHiddenHighlighterAceController } from "../../../../skulpt-connection/code-editor";
import RawElement from "../../../RawElement";
import { assertNever, failIfNull } from "../../../../utils";

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
      <div className="DiffViewKindOption-container">
        <div className={classes} onClick={() => setViewKind(thisViewKind)}>
          <span>{label}</span>
        </div>
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

type ScriptDiffViewProps = {
  thisViewKind: DiffViewKind;
  activeViewKind: DiffViewKind;
  lines: Array<ScriptDiffLine>;
};
const ScriptDiffView: React.FC<ScriptDiffViewProps> = ({
  thisViewKind,
  activeViewKind,
  lines,
}) => {
  const isActive = activeViewKind === thisViewKind;
  const classes = classNames("ScriptDiffView", { isActive });

  const rawContent = lines.map((line, idx) => (
    <ScriptDiffViewLine key={idx} line={line} />
  ));

  // Special case for adding the first code to a currently-empty script:
  const contentIsEmpty = lines.length === 0;
  const isEmptyPureOld = contentIsEmpty && thisViewKind === "bare-old";
  const content = isEmptyPureOld ? (
    <div className="global-placeholder">
      <pre>
        <code>[This script has no code yet.]</code>
      </pre>
    </div>
  ) : (
    rawContent
  );

  return <div className={classes}>{content}</div>;
};

function enrichedDiff(oldCodeText: string, newCodeText: string) {
  const aceController = failIfNull(
    getHiddenHighlighterAceController(),
    "cannot get hidden Ace controller for highlighting"
  );
  const enrich = (code: string) => aceController.highlightedCode(code);
  return new EnrichedDiff(oldCodeText, newCodeText, enrich);
}

type ScriptCodeDiffProps = {
  richDiff: EnrichedDiff<HTMLElement>;
};
export const ScriptCodeDiff: React.FC<ScriptCodeDiffProps> = ({ richDiff }) => {
  const [viewKind, setViewKind] = useState<DiffViewKind>("bare-old");
  return (
    <>
      <div className="code-representations">
        <ScriptDiffView
          thisViewKind="bare-old"
          activeViewKind={viewKind}
          lines={richDiff.viewBareOld()}
        />
        <ScriptDiffView
          thisViewKind="old-diff"
          activeViewKind={viewKind}
          lines={richDiff.viewOldDiff()}
        />
        <ScriptDiffView
          thisViewKind="new-diff"
          activeViewKind={viewKind}
          lines={richDiff.viewNewDiff()}
        />
      </div>
      <DiffViewKindSelector {...{ viewKind, setViewKind }} />
    </>
  );
};

type ScriptDiffProps = {
  actorKind: ActorKind;
  event: EventDescriptor;
  oldCodeText: string;
  newCodeText: string;
};
export const ScriptDiff: React.FC<ScriptDiffProps> = (props) => {
  const diff = enrichedDiff(props.oldCodeText, props.newCodeText);
  return (
    <div className="ScriptDiff">
      <DisplayHatBlock
        actorKind={props.actorKind}
        event={props.event}
        variant="in-editor"
      />
      <ScriptCodeDiff richDiff={diff} />
    </div>
  );
};

type DisplayScriptProps = {
  actorKind: ActorKind;
  event: EventDescriptor;
  codeText: string;
};
export const DisplayScript: React.FC<DisplayScriptProps> = ({
  actorKind,
  event,
  codeText,
}) => {
  // It's a bit clunky to use the diff machinery, but it does the job.
  const diff = enrichedDiff(codeText, "");
  const viewProps: ScriptDiffViewProps = {
    activeViewKind: "bare-old",
    thisViewKind: "bare-old",
    lines: diff.viewBareOld(),
  };

  return (
    <div className="ScriptDiff">
      <DisplayHatBlock
        actorKind={actorKind}
        event={event}
        variant="in-editor"
      />
      <div className="code-representations">
        <ScriptDiffView {...viewProps} />
      </div>
    </div>
  );
};
