import { Container, ListGroup } from "react-bootstrap";
import { EmptyProps } from "../../utils";
import { useI18nResolvedLanguage, useSetLanguageFun } from "./hooks";
import {
  kLanguagePreferenceOrder,
  languageDisplayName,
} from "../../model/languages";
import { useTranslation } from "react-i18next";
import { useRef } from "react";
import { MaybeSeizeFocus } from "../MaybeSeizeFocus";
import "./LanguageChooser.scss";

export const LanguageChooser: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("ide");
  const resolvedLanguage = useI18nResolvedLanguage();
  const setLanguageFun = useSetLanguageFun();
  const activeButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="LanguageChooser gfs__help-content">
      <MaybeSeizeFocus target="activity-content" targetRef={activeButtonRef} />
      <Container className="help-text">
        <h1>{t("language-chooser.header")}</h1>
        <ListGroup>
          {kLanguagePreferenceOrder.map((lngCode) => {
            const isActive = lngCode === resolvedLanguage;
            return (
              <ListGroup.Item
                key={lngCode}
                ref={isActive ? activeButtonRef : undefined}
                data-language-code={lngCode}
                as="button"
                active={isActive}
                onClick={setLanguageFun(lngCode)}
              >
                {languageDisplayName(lngCode)}
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </Container>
    </div>
  );
};
