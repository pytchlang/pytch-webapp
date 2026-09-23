import React, { useRef } from "react";
import { Trans, useTranslation } from "react-i18next";
import { assertNever, EmptyProps } from "../../../utils";
import { useLinkedSpecimen } from "./hooks";
import { WidthMonitor } from "../WidthMonitor";
import { Button } from "react-bootstrap";
import { LinkedSpecimen } from "../../../model/linked-content";
import { useStoreState } from "../../../store";
import { codeTextEnsuringFlat } from "../../hooks/code-text";
import { useRunFlow } from "../../../model";
import { MaybeSeizeFocus } from "../../MaybeSeizeFocus";

type ActionButtonsProps = { specimen: LinkedSpecimen };
const ActionButtons: React.FC<ActionButtonsProps> = ({ specimen }) => {
  const { t } = useTranslation("tutorials");
  const runFlow = useRunFlow((f) => f.viewCodeDiffFlow);
  const program = useStoreState((state) => state.activeProject.project.program);
  const specimenKind = specimen.lesson.project.program.kind;
  switch (specimenKind) {
    case "flat": {
      const originalCodeText = specimen.lesson.project.program.text;
      const currentCodeText = codeTextEnsuringFlat("<ActionButtons>", program);
      const launch = () => {
        runFlow({ textA: originalCodeText, textB: currentCodeText });
      };
      return (
        <Button onClick={launch}>{t("specimen.compare-to-original")}</Button>
      );
    }
    case "per-method":
      return false;
    default:
      return assertNever(specimenKind);
  }
};

export const SpecimenInformation: React.FC<EmptyProps> = () => {
  const specimen = useLinkedSpecimen();
  const contentRef = useRef<HTMLDivElement>(null);

  const specimenName = specimen.lesson.project.name;

  return (
    <div className="Junior-LessonContent-container">
      <WidthMonitor nonStageWd={980} />
      <div className="Junior-LessonContent-HeaderBar">
        <div className="specimen-name">{specimenName}</div>
      </div>

      <div className="Junior-LessonContent-inner-container">
        <MaybeSeizeFocus targetRef={contentRef} />
        <div
          className="Junior-LessonContent gfs__help-content abs-0000-oflow"
          tabIndex={0}
          ref={contentRef}
        >
          <div className="content">
            <p>
              <Trans
                ns="tutorials"
                i18nKey="specimen.based-on"
                values={{ specimenName }}
              />
            </p>
            <ActionButtons specimen={specimen} />
          </div>
        </div>
      </div>
    </div>
  );
};
