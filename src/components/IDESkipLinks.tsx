import React from "react";
import { SkipLinkFocusTarget } from "../model/junior/global-steer-focus";
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
    >
      <span>{label}</span>
    </button>
  );
};
