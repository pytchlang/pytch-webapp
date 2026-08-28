import { Container, ListGroup } from "react-bootstrap";
import { EmptyProps } from "../../utils";
import { useI18nResolvedLanguage, useSetLanguageFun } from "./hooks";
import { supportedLanguages } from "../../model/i18n";
import { useTranslation } from "react-i18next";
import "./LanguageChooser.scss";

export const LanguageChooser: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("ide");
  const resolvedLanguage = useI18nResolvedLanguage();
  const setLanguageFun = useSetLanguageFun();

  return (
    <div className="LanguageChooser gfs__help-content" tabIndex={0}>
      <Container className="help-text">
        <h1>{t("language-chooser.header")}</h1>
        <ListGroup>
          {supportedLanguages.map((lngDescr) => (
            <ListGroup.Item
              data-language-code={lngDescr.lngCode}
              as="button"
              key={lngDescr.lngCode}
              active={lngDescr.lngCode === resolvedLanguage}
              onClick={setLanguageFun(lngDescr.lngCode)}
            >
              {lngDescr.name}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Container>
    </div>
  );
};
