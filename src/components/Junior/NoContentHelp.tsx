import React from "react";
import Alert from "react-bootstrap/Alert";

type NoContentHelpProps = {
  actorKind: string;
  contentKind: string;
};
export const NoContentHelp: React.FC<NoContentHelpProps> = ({
  actorKind,
  contentKind,
}) => {
  return (
    <Alert className="NoContentHelp" variant="primary">
      <p>
        Your {actorKind} has no {contentKind} yet. Use the button below to add
        one!
      </p>
    </Alert>
  );
};
