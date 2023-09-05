import React from "react";
import { useStoreState, useStoreActions } from "../../store";

import classNames from "classnames";
import { HelpSidebar } from "./HelpSidebar";
import { HelpSidebarOpenControl } from "../HelpSidebar";
import { Lorem } from "./Lorem";

const HelpSidebarMachinery = () => {
  // TODO: The below makes this state be shared between editors for
  // different program-kinds; maybe that's correct?
  const isVisible = useStoreState(
    (state) => state.ideLayout.helpSidebar.isVisible
  );
  const stateClass = isVisible ? "expanded" : "collapsed";

  const classes = classNames("Junior-HelpSidebarMachinery", stateClass);
  return (
    <div className={classes}>
      {isVisible ? <HelpSidebar /> : <HelpSidebarOpenControl />}
    </div>
  );
};

const ScriptsEditor = () => {
  return (
    <div className="Junior-ScriptsEditor">
      <h2>ScriptsEditor</h2>
      <Lorem />
    </div>
  );
};

export const CodeEditor = () => {
  return (
    <div className="Junior-CodeEditor abs-0000">
      <HelpSidebarMachinery />
      <ScriptsEditor />
    </div>
  );
};
