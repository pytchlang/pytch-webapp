import React, {KeyboardEventHandler} from "react";
import {useStoreState} from "../../store";
import {DivSettingWindowTitle} from "../DivSettingWindowTitle";
import {ActivityPane} from "../Junior/ActivityPane";
import {EditorAndOutErr} from "../EditorAndOutErr";
import {StageAndActorsOrAssets} from "../StageAndActorsOrAssets";
import {NotableChangeToasts} from "../NotableChangeToasts";
import {Modals} from "../IDELayout";

interface SplitScreenLayoutProps {
    classes?: string,
    mainOnKeyDown?: KeyboardEventHandler
}

export const SplitScreenLayout: React.FC<SplitScreenLayoutProps> = ({classes, mainOnKeyDown}: SplitScreenLayoutProps) => {
    const projectId = useStoreState((state) => state.activeProject.project.id);
    const projectName = useStoreState(
        (state) => state.activeProject.project.name
    );

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
                <ActivityPane />
                <EditorAndOutErr />
                <StageAndActorsOrAssets />
            </main>
        </DivSettingWindowTitle>
    );
};
