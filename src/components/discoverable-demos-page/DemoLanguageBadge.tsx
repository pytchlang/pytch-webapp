import React from "react";
import { supportedLanguages } from "../../model/i18n";
import { useI18nResolvedLanguage } from "../Junior/hooks";

type DemoLanguageBadgeProps = { language: string };

/** If the given `language` differs from the current UI language, show
 * a badge giving the language's name (in that language), or its code
 * if it is not one of the UI's supported languages.  Otherwise render
 * nothing. */
export const DemoLanguageBadge: React.FC<DemoLanguageBadgeProps> = ({
  language,
}) => {
  const uiLanguage = useI18nResolvedLanguage();
  if (language === uiLanguage) {
    return null;
  }

  const mSupportedLanguage = supportedLanguages.find(
    (lng) => lng.lngCode === language
  );
  const name = mSupportedLanguage?.name ?? language;

  return (
    <div className="pill-language" lang={language}>
      <p>{name}</p>
    </div>
  );
};
