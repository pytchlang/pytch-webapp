import React from "react";
import { EmptyProps } from "../../utils";
import { ActivityBar } from "./ActivityBar";
import { ActivityContent } from "./ActivityContent";
import { useTranslation } from "react-i18next";
import { SectionWithHiddenH2 } from "../SectionWithHiddenH2";

export const ActivityPane: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("ide");
  return (
    <SectionWithHiddenH2
      className="ActivityPane"
      headingContent={t("activity-pane.aria-label")}
    >
      <ActivityBar />
      <ActivityContent />
    </SectionWithHiddenH2>
  );
};
