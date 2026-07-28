import { Container, Form, ListGroup } from "react-bootstrap";
import { useStoreActions } from "../../store";
import { EmptyProps } from "../../utils";
import { useI18nResolvedLanguage } from "./hooks";
import { supportedLanguages } from "../../model/i18n";
import { useTranslation } from "react-i18next";
import "./LanguageChooser.scss";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const LanguageChooser: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("ide");
  const resolvedLanguage = useI18nResolvedLanguage();
  const setLanguage = useStoreActions(
    (actions) => actions.i18nContextState.setLanguage
  );

  const setLanguageFun = (lng: string) => () => setLanguage(lng);

  return (
    <div className="LanguageChooser gfs__help-content" tabIndex={0}>
      {/*<h2 className={"pt-4 pb-3 px-3"}></h2>*/}
      <Form.Label id="language-label" htmlFor="language-chooser-list">
        <FontAwesomeIcon icon={"language"} className={"me-2"} />
        {t("language-chooser.header")}
      </Form.Label>
      <Container id={"language-chooser-list"} className="help-text">
        <ListGroup>
          {supportedLanguages.map((lngDescr) => (
            <ListGroup.Item
              as="button"
              key={lngDescr.lngCode}
              active={lngDescr.lngCode === resolvedLanguage}
              onClick={setLanguageFun(lngDescr.lngCode)}
            >
              {lngDescr.name}
            </ListGroup.Item>
          ))}
        </ListGroup>
        {/* No need to make this a translation string; it will go away
            once Gaeilge is available. */}
        <p className="mt-3">Gaeilge coming soon!</p>
      </Container>
    </div>
  );
};
