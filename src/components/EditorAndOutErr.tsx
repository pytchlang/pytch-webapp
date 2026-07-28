import React from "react";
import classNames from "classnames";
import { useStoreState } from "../store";
import { useJrEditActions, useJrEditState } from "./Junior/hooks";
import { EmptyProps, assertNever } from "../utils";
import { CodeEditor } from "./CodeEditor";
import { InfoPanel } from "./Junior/InfoPanel";
import { ActorProperties } from "./Junior/ActorProperties";
import {
  Group,
  Panel,
  Separator,
  usePanelRef,
} from "react-resizable-panels";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { minInfoPanelHeight } from "../constants";

export const EditorForProgramKind: React.FC<EmptyProps> = () => {
  const programKind = useStoreState(
    (state) => state.activeProject.project.program.kind
  );

  switch (programKind) {
    case "flat":
      return <CodeEditor />;
    case "per-method":
      return <ActorProperties />;
    default:
      return assertNever(programKind);
  }
};

export const EditorAndOutErr: React.FC<EmptyProps> = () => {
  const infoPanelIsCollapsed = useJrEditState(
    (s) => s.infoPanelState === "collapsed"
  );

  const infoResizablePanelRef = usePanelRef();
  const toggleStateAction = useJrEditActions((a) => a.toggleInfoPanelState);
  const isCollapsed = useJrEditState((s) => s.infoPanelState === "collapsed");

  const classes = classNames("EditorAndOutErr", { infoPanelIsCollapsed });

  return (
      <Group className={classes} orientation="vertical">
        <Panel minSize={240}>
          <EditorForProgramKind />
        </Panel>
        <Separator className={"verticalSeparator customSeparator d-flex justify-content-center align-items-center"}>
          <div className={"separatorIcon"}>
            <FontAwesomeIcon icon={"ellipsis-h"} style={{color: "white", position: "relative", top: "-9px", width: "20px"}} />
          </div>
        </Separator>
        <Panel minSize={minInfoPanelHeight} collapsedSize={minInfoPanelHeight} collapsible={true} panelRef={infoResizablePanelRef} onResize={(panelSize, id, prevPanelSize) => {
          console.log('panelSize', panelSize.inPixels);
          if ((panelSize.inPixels <= minInfoPanelHeight && prevPanelSize?.inPixels > minInfoPanelHeight && !isCollapsed) || panelSize.inPixels > minInfoPanelHeight && prevPanelSize?.inPixels <= minInfoPanelHeight && isCollapsed) {
            toggleStateAction();
          }
        }}>
          <InfoPanel resizablePanelRef={infoResizablePanelRef}/>
        </Panel>
      </Group>
  );
};
