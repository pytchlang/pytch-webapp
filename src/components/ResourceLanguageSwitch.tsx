import React from "react";
import { TwoStateSwitch } from "./TwoStateSwitch";
import { useI18nResolvedLanguage } from "./Junior/hooks";
import { languageDisplayName } from "../model/languages";
import { ResourceLanguageSelector } from "../model/resource-language";

type ResourceKind = "demos" | "tutorials";

const kI18nSpecFromResourceKind = {
  demos: { ns: "demos", keyPart: "search.language-switch" },
  tutorials: { ns: "tutorials", keyPart: "list.language-switch" },
} as const;

type ResourceLanguageSwitchProps = {
  resourceKind: ResourceKind;
  languageSelector: ResourceLanguageSelector;
  setLanguageSelector: (selector: ResourceLanguageSelector) => void;
};

/** A switch letting the user choose between all resources (demos or
 * tutorials) and just those available in the current UI language. */
export const ResourceLanguageSwitch: React.FC<ResourceLanguageSwitchProps> = ({
  resourceKind,
  languageSelector,
  setLanguageSelector,
}) => {
  const uiLanguage = useI18nResolvedLanguage();

  const setShowAll = (showAll: boolean) => {
    setLanguageSelector(showAll ? "all" : "ui-language");
  };

  return (
    <TwoStateSwitch
      className={`${resourceKind}-language-switch`}
      i18nSpec={{
        ...kI18nSpecFromResourceKind[resourceKind],
        params: { language: languageDisplayName(uiLanguage) },
      }}
      boolState={languageSelector === "all"}
      setBoolState={setShowAll}
    />
  );
};
