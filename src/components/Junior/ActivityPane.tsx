import React from "react";
import { EmptyProps } from "../../utils";
import { ActivityBar } from "./ActivityBar";
import { ActivityContent } from "./ActivityContent";
import { useTranslation } from "react-i18next";

export const ActivityPane: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("ide");
  return (
    <div className={"activity-pane-wrapper"}>
      <section
        className="ActivityPane"
        aria-label={t("activity-pane.aria-label")}
      >
        <ActivityBar />
        <ActivityContent />
      </section>
    </div>
  );
};
