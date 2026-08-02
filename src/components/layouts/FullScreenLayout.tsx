import React from "react";
import { EmptyProps } from "../../utils";
import { useStoreState } from "../../store";
import { DivSettingWindowTitle } from "../DivSettingWindowTitle";
import { StageWithControls } from "../StageWithControls";

export const FullScreenLayout: React.FC<EmptyProps> = () => {
  const projectId = useStoreState((s) => s.activeProject.project.id);
  const projectName = useStoreState((s) => s.activeProject.project.name);

  return (
    <DivSettingWindowTitle
      className="FullScreenLayout abs-0000"
      windowTitle={`Pytch: ${projectName}`}
      data-project-id={projectId}
    >
      <main className="abs-0000">
        <div className="FullScreenStage" role={"region"}>
          <StageWithControls />
        </div>
      </main>
    </DivSettingWindowTitle>
  );
};
