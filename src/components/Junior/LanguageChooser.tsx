import { Container, ListGroup } from "react-bootstrap";
import { EmptyProps } from "../../utils";
import { useI18nResolvedLanguage, useSetLanguageFun } from "./hooks";
import { supportedLanguages } from "../../model/i18n";
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
      <MaybeSeizeFocus targetRef={activeButtonRef} />
      <Container className="help-text">
        <h1>{t("language-chooser.header")}</h1>
        <ListGroup>
          {supportedLanguages.map((lngDescr) => {
            const isActive = lngDescr.lngCode === resolvedLanguage;
            return (
              <ListGroup.Item
                key={lngDescr.lngCode}
                ref={isActive ? activeButtonRef : undefined}
                data-language-code={lngDescr.lngCode}
                as="button"
                active={isActive}
                onClick={setLanguageFun(lngDescr.lngCode)}
              >
                {lngDescr.name}
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </Container>
    </div>
  );
};
