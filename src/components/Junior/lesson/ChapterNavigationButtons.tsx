import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useUiLangAttribute } from "../hooks";

type ChapterNavigation = {
  displayTitle: string;
  navigate: () => void;
};
export type ChapterNavigationButtonsProps = {
  next?: ChapterNavigation;
  prev?: ChapterNavigation;
};
export const ChapterNavigationButtons: React.FC<
  ChapterNavigationButtonsProps
> = ({ next, prev }) => {
  const { t: tTutorials } = useTranslation("tutorials");
  const uiLang = useUiLangAttribute();
  const t = (keySuffix: "prev" | "next", displayTitle: string) => {
    const i18nKey = `chapter-navigation.${keySuffix}` as const;
    return tTutorials(i18nKey, { replace: { displayTitle } });
  };

  // To keep the layout simple (via justify-content: space-between),
  // generate an empty DIV for an unwanted button, rather than leaving
  // that element out altogether.

  const mPrevButton =
    prev != null ? (
      <Button variant="secondary" className="prev" onClick={prev.navigate}>
        <FontAwesomeIcon className="prev-arrow" icon="arrow-left-long" />{" "}
        {t("prev", prev.displayTitle)}
      </Button>
    ) : (
      <div />
    );

  const mNextButton =
    next != null ? (
      <Button className="next" onClick={next.navigate}>
        {t("next", next.displayTitle)}{" "}
        <FontAwesomeIcon className="next-arrow" icon="arrow-right-long" />
      </Button>
    ) : (
      <div />
    );

  return (
    // The chapter titles in the buttons are in the tutorial's language,
    // but they are interpolated into UI text, so treat the whole button
    // label as being in the UI language.
    <div className="Junior-ChapterNavigation" lang={uiLang}>
      {mPrevButton}
      {mNextButton}
    </div>
  );
};
