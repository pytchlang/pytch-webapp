import React from "react";
import { languageDisplayName } from "../model/languages";
import { useI18nResolvedLanguage } from "./Junior/hooks";

type ResourceLanguageBadgeProps = {
  language: string;
  alwaysShow?: boolean;
};

/** Show a badge giving the name (in that language) of the given
 * `language`, or its code if it is not one of the UI's supported
 * languages.  Unless `alwaysShow` is true, show the badge only if
 * `language` differs from the current UI language, and otherwise
 * render nothing. */
export const ResourceLanguageBadge: React.FC<ResourceLanguageBadgeProps> = ({
  language,
  alwaysShow = false,
}) => {
  const uiLanguage = useI18nResolvedLanguage();
  if (!alwaysShow && language === uiLanguage) {
    return null;
  }

  return (
    <div className="pill-language" lang={language}>
      <p>{languageDisplayName(language)}</p>
    </div>
  );
};
