import React from "react";
import { EmptyProps } from "../utils";
import { useStoreState } from "../store";
import { DivSettingWindowTitle } from "./DivSettingWindowTitle";
import { StageWithControls } from "./StageWithControls";
import { useTranslation } from "react-i18next";
import { NotableChangeToasts } from "./NotableChangeToasts";

export const FullScreenLayout: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("ide");
  const projectId = useStoreState((s) => s.activeProject.project.id);
  const projectName = useStoreState((s) => s.activeProject.project.name);

  return (
    <DivSettingWindowTitle
      className="FullScreenLayout abs-0000"
      windowTitle={`Pytch: ${projectName}`}
      data-project-id={projectId}
    >
      <main aria-label={t("main-fullscreen.aria-label")} className="abs-0000">
        <div className="FullScreenStage">
          <NotableChangeToasts />
          <StageWithControls />
        </div>
      </main>
    </DivSettingWindowTitle>
  );
};
