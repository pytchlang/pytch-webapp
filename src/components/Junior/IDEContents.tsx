import React from "react";
import { DivSettingWindowTitle } from "../DivSettingWindowTitle";
import { EditorAndInfo } from "./EditorAndInfo";
import { StageAndActorsList } from "./StageAndActorsList";
import { EmptyProps } from "../../utils";
import { useStoreState } from "../../store";

export const IDEContents: React.FC<EmptyProps> = () => {
  const projectName = useStoreState(
    (state) => state.activeProject.project.name
  );

  return (
    <>
      <DivSettingWindowTitle
        className="Junior-IDEContents abs-0000"
        windowTitle={`Pytch: ${projectName}`}
      >
        <EditorAndInfo />
        <StageAndActorsList />
      </DivSettingWindowTitle>
    </>
  );
};
