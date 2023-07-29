import React from "react";
import { EmptyProps } from "../utils";

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

export const ViewCodeDiffModal: React.FC<EmptyProps> = () => {
};
