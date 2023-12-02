import React from "react";
import { EmptyProps } from "../utils";
import { useStoreActions, useStoreState } from "../store";
import { Button, Modal } from "react-bootstrap";
import { CodeDiffHunk } from "../model/code-diff";

type PreTableDatumProps = { content: string | undefined };
const PreTableDatum: React.FC<PreTableDatumProps> = ({ content }) => (
  <td>
    <pre>{content ?? ""}</pre>
  </td>
);

type DiffTableRowProps = { a?: JSX.Element; b?: JSX.Element };
const DiffTableRow: React.FC<DiffTableRowProps> = ({ a, b }) => (
  <tr>
    {a ?? <td />}
    <td>&nbsp;</td>
    {b ?? <td />}
  </tr>
);

type SideBySideDiffContributionProps = { change: CodeDiffHunk };
const SideBySideDiffContribution: React.FC<SideBySideDiffContributionProps> = ({
  change,
}) => {
  switch (change.kind) {
    case "change": {
      // Use loop because we want to generate an array as long as the
      // longer of the two.
      const nLines = Math.max(change.aLines.length, change.bLines.length);
      let trElts: Array<JSX.Element> = [];
      for (let i = 0; i !== nLines; ++i) {
        const tdA = <PreTableDatum content={change.aLines[i]} />;
        const tdB = <PreTableDatum content={change.bLines[i]} />;
        trElts.push(<DiffTableRow key={i} a={tdA} b={tdB} />);
      }
      return <tbody className="diff-hunk change">{trElts}</tbody>;
    }
    case "context": {
      const trElts = change.commonLines.map((line, idx) => {
        // Ensure distinct objects for the two elements:
        const tdA = <PreTableDatum content={line} />;
        const tdB = <PreTableDatum content={line} />;
        return <DiffTableRow key={idx} a={tdA} b={tdB} />;
      });
      return <tbody className="diff-hunk context">{trElts}</tbody>;
    }
    case "add": {
      const trElts = change.bLines.map((line, idx) => {
        const td = <PreTableDatum content={line} />;
        return <DiffTableRow key={idx} b={td} />;
      });
      return <tbody className="diff-hunk add">{trElts}</tbody>;
    }
    case "del": {
      const trElts = change.aLines.map((line, idx) => {
        const td = <PreTableDatum content={line} />;
        return <DiffTableRow key={idx} a={td} />;
      });
      return <tbody className="diff-hunk del">{trElts}</tbody>;
    }
  }
};

type SideBySideDiffProps = { changes: Array<CodeDiffHunk> };
const SideBySideDiff: React.FC<SideBySideDiffProps> = ({ changes }) => {
  return (
    <div className="table-container">
      <table className="code-diff side-by-side">
        <tbody>
          <tr>
            <th>Original code</th>
            <th />
            <th>Your code</th>
          </tr>
        </tbody>
        {changes.map((ch, i) => (
          <SideBySideDiffContribution key={i} change={ch} />
        ))}
      </table>
    </div>
  );
};

export const ViewCodeDiffModal: React.FC<EmptyProps> = () => {
  // TODO: Allow side-by-side or unified diff.

  const state = useStoreState(
    (state) => state.userConfirmations.viewCodeDiff.state
  );
  const dismiss = useStoreActions(
    (actions) => actions.userConfirmations.viewCodeDiff.dismiss
  );

  if (state.kind === "idle") return null;

  return (
    <Modal className="ViewCodeDiffModal" show={true} size="xl">
      <Modal.Header>
        <Modal.Title>Compare your code against original</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <SideBySideDiff changes={state.hunks} />
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => dismiss()}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};
