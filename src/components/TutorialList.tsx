import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { NavBanner } from "./NavBanner";
import { useStoreActions, useStoreState } from "../store";
import { SyncState } from "../model/project";
import { TutorialSummaryDisplay } from "./TutorialSummaryDisplay";
import { EmptyProps } from "../utils";
import { ContentLoadingSpinner } from "./Junior/ContentLoadingSpinner";
import { useI18nResolvedLanguage } from "./Junior/hooks";
import { ResourceLanguageSwitch } from "./ResourceLanguageSwitch";
import { displayedTutorials } from "../model/tutorial-languages";

const LoadingTutorialsPlaceholder = () => {
  const syncState = useStoreState(
    (state) => state.tutorialCollection.syncState
  );

  if (syncState === SyncState.Syncd) return null;

  return <ContentLoadingSpinner />;
};

const TutorialsLanguageSwitch: React.FC<EmptyProps> = () => {
  const languageSelector = useStoreState(
    (state) => state.tutorialCollection.languageSelector
  );
  const setLanguageSelector = useStoreActions(
    (actions) => actions.tutorialCollection.setLanguageSelector
  );

  return (
    <div className="tutorials-language-switch-container">
      <ResourceLanguageSwitch
        resourceKind="tutorials"
        languageSelector={languageSelector}
        setLanguageSelector={setLanguageSelector}
      />
    </div>
  );
};

const TutorialList: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("tutorials");
  const loadSummaries = useStoreActions(
    (actions) => actions.tutorialCollection.loadSummaries
  );
  const syncState = useStoreState(
    (state) => state.tutorialCollection.syncState
  );
  const available = useStoreState(
    (state) => state.tutorialCollection.available
  );
  const languageSelector = useStoreState(
    (state) => state.tutorialCollection.languageSelector
  );
  const uiLanguage = useI18nResolvedLanguage();
  const tutorials = displayedTutorials(available, uiLanguage, languageSelector);

  const docTitle = t("list.window-title");
  useEffect(() => {
    document.title = docTitle;
    if (syncState === SyncState.SyncNotStarted) {
      loadSummaries();
    }
  }, [loadSummaries, syncState, docTitle]);

  const paneRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    paneRef.current?.focus();
  });

  return (
    <>
      <NavBanner />
      <div className="TutorialList" tabIndex={-1} ref={paneRef}>
        <h1>{t("list.title")}</h1>
        <TutorialsLanguageSwitch />
        <LoadingTutorialsPlaceholder />
        <ul className="tutorial-list">
          {tutorials.map((t) => (
            <TutorialSummaryDisplay
              key={t.slug}
              tutorial={t}
              kind="tutorial-demo-and-share"
            />
          ))}
        </ul>
      </div>
    </>
  );
};

export default TutorialList;
