import React from "react";
import { EmptyProps } from "../utils";

type PreTableDatumProps = { content: string | undefined };
const PreTableDatum: React.FC<PreTableDatumProps> = ({ content }) => (
  <td>
    <pre>{content ?? ""}</pre>
  </td>
);

export const ViewCodeDiffModal: React.FC<EmptyProps> = () => {
};
