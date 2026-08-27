import React from "react";
import { SkipLinkFocusTarget } from "../model/junior/global-steer-focus";
import { assertNever, EmptyProps } from "../utils";
import { useStoreState } from "../store";
import { useTranslation } from "react-i18next";
import { useFocusContext } from "./hooks/focus-steering";

type SkipLinkProps = {
  focusTarget: SkipLinkFocusTarget; // Re-used as component of i18n key
};
const SkipLink: React.FC<SkipLinkProps> = ({ focusTarget }) => {
  const { t } = useTranslation("ide");
  const focusContext = useFocusContext();

  const key = `skip-link.${focusTarget}.label` as const;
  const label = t(key);
  return (
    <button
      type="button"
      className="visually-hidden-focusable"
      aria-label={label}
      onClick={() => {
        focusContext.focusGlobalFocusTarget(focusTarget);
      }}
      data-target-key={focusTarget}
    >
      <span>{label}</span>
    </button>
  );
};

const FlatSkipLinks: React.FC<EmptyProps> = () => {
  return (
    <>
      <SkipLink focusTarget="activity-tab-bar" />
      <SkipLink focusTarget="flat-code" />
      <SkipLink focusTarget="project-stage" />
      <SkipLink focusTarget="flat-assets" />
    </>
  );
};

const PerMethodSkipLinks: React.FC<EmptyProps> = () => {
  return (
    <>
      <SkipLink focusTarget="activity-tab-bar" />
      <SkipLink focusTarget="per-method-actor-props" />
      <SkipLink focusTarget="project-stage" />
      <SkipLink focusTarget="per-method-actors" />
    </>
  );
};

export const IDESkipLinks: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("ide");

  const programKind = useStoreState(
    (state) => state.activeProject.project.program.kind
  );

  const content = (() => {
    switch (programKind) {
      case "flat":
        return <FlatSkipLinks />;
      case "per-method":
        return <PerMethodSkipLinks />;
      default:
        return assertNever(programKind);
    }
  })();

  return (
    <nav className="pytch-skip-links" aria-label={t("skip-links.aria-label")}>
      {content}
    </nav>
  );
};
