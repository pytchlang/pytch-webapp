import React, { useEffect } from "react";
import { useStoreActions } from "../../store";
import { HelpSidebarInnerContent } from "../HelpSidebar";

const HelpSidebar = () => {
  const ensureHaveContent = useStoreActions(
    (actions) => actions.ideLayout.helpSidebar.ensureHaveContent
  );

  useEffect(() => {
    ensureHaveContent();
  });

  return (
    <div className="HelpSidebar">
      <div className="content">
        <div className="inner-content">
          <HelpSidebarInnerContent activeProgramKind="per-method" />
        </div>
      </div>
    </div>
  );
};
