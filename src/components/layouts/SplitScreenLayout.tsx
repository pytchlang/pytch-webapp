import React, {KeyboardEventHandler} from "react";
import {useStoreState} from "../../store";
import {DivSettingWindowTitle} from "../DivSettingWindowTitle";
import {ActivityPane} from "../Junior/ActivityPane";
import {EditorAndOutErr} from "../EditorAndOutErr";
import {StageAndActorsOrAssets} from "../StageAndActorsOrAssets";
import {NotableChangeToasts} from "../NotableChangeToasts";
import {Modals} from "../IDELayout";
import {useStoreActions} from "easy-peasy";
import {Group, Panel, PanelSize, Separator, useDefaultLayout} from "react-resizable-panels";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {minStageWidth} from "../Junior/WidthMonitor";
import {stageWidth} from "../../constants";

interface SplitScreenLayoutProps {
    classes?: string,
    mainOnKeyDown?: KeyboardEventHandler
}

export const SplitScreenLayout: React.FC<SplitScreenLayoutProps> = ({classes, mainOnKeyDown}: SplitScreenLayoutProps) => {
    const projectId = useStoreState((state) => state.activeProject.project.id);
    const projectName = useStoreState(
        (state) => state.activeProject.project.name
    );
    const setStageDisplayWidth = useStoreActions(
        (actions) => actions.ideLayout.setStageDisplayWidth
    );

    const { defaultLayout, onLayoutChanged } = useDefaultLayout({
        id: "three-panes",
        storage: localStorage
    });
    // TODO: consider using groupref > setLayout() to switch to two-pane group layout when collapsing a menu
    return (
        <DivSettingWindowTitle
            className={classes}
            windowTitle={`Pytch: ${projectName}`}
            data-project-id={projectId}
        >
            <Modals />
            <NotableChangeToasts />
            <main tabIndex={-1} onKeyDown={mainOnKeyDown}>
                <h1 className={"me-auto my-auto project-name skip-link"}>
                    {projectName}
                </h1>
                <Group className={"resizablePanels vw-100"} defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged}>
                    <Panel minSize={260}>
                        <ActivityPane />
                    </Panel>
                    <Separator className={"horizontalSeparator customSeparator d-flex justify-content-center align-items-center"}>
                        <FontAwesomeIcon icon={"ellipsis-v"} className={"separatorIcon"} />
                    </Separator>
                    <Panel minSize={300}>
                        <EditorAndOutErr />
                    </Panel>
                    <Separator className={"horizontalSeparator customSeparator d-flex justify-content-center align-items-center"}>
                        <FontAwesomeIcon icon={"ellipsis-v"} className={"separatorIcon"} />
                    </Separator>
                    <Panel minSize={minStageWidth + 20} maxSize={500}
                           onResize={
                               ((panelSize: PanelSize) => {
                                   //TODO update stage width
                                   const targetWidth = Math.min(
                                       stageWidth,
                                       Math.max(minStageWidth, panelSize.inPixels - 20)
                                   );
                                   setStageDisplayWidth(targetWidth);
                               })}>
                        <StageAndActorsOrAssets/>
                    </Panel>
                </Group>
            </main>
        </DivSettingWindowTitle>
    );
};
