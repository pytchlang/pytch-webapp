import React from "react";
import { EmptyProps } from "../../utils";
import { ActivityBar } from "./ActivityBar";
import { ActivityContent } from "./ActivityContent";

export const ActivityPane: React.FC<EmptyProps> = () => {
  return (
    <section className="ActivityPane" aria-label="Help">
      <ActivityBar />
      <ActivityContent />
    </section>
  );
};
