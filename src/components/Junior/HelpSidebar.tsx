import React, { useEffect } from "react";
import { useStoreActions } from "../../store";
import Button from "react-bootstrap/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { HelpSidebarInnerContent } from "../HelpSidebar";

export const HelpSidebar = () => {
  const { toggleVisibility, ensureHaveContent } = useStoreActions(
    (actions) => actions.ideLayout.helpSidebar
  );

  useEffect(() => {
    ensureHaveContent();
  });

  return (
    <>
      <Button
        variant="outline-secondary"
        className="dismiss-help"
        onClick={() => toggleVisibility()}
      >
        <p>
          <FontAwesomeIcon className="fa-lg" icon={["far", "times-circle"]} />
        </p>
      </Button>
      <div className="content">
        <div className="inner-content">
          <HelpSidebarInnerContent />
        </div>
      </div>
    </>
  );
};
