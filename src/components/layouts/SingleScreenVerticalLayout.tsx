import React, {KeyboardEventHandler} from "react";
import {useStoreState} from "../../store";
import {DivSettingWindowTitle} from "../DivSettingWindowTitle";
import {ActivityPane} from "../Junior/ActivityPane";
import {NotableChangeToasts} from "../NotableChangeToasts";
import {StageControls} from "../StageControls";
import {ProjectControls} from "../ProjectControls";
import {Modals} from "../IDELayout";

interface SingleScreenVerticalLayoutProps {
    classes?: string,
    mainOnKeyDown?: KeyboardEventHandler,
}

export const SingleScreenVerticalLayout: React.FC<SingleScreenVerticalLayoutProps> = ({classes, mainOnKeyDown}: SingleScreenVerticalLayoutProps) => {

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
            <main
                tabIndex={-1}
                onKeyDown={mainOnKeyDown}
                className={"single-screen"}
            >
                <div
                    className={"single-screen-header d-flex justify-content-end p-2"}
                >
                    <h1 className={"my-auto me-auto project-name"}>{projectName}</h1>
                    <StageControls />
                    <ProjectControls />
                </div>
                <ActivityPane />
            </main>
        </DivSettingWindowTitle>
    );
};
