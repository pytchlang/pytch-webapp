import { Container, ListGroup } from "react-bootstrap";
import { useStoreActions } from "../../store";
import { EmptyProps } from "../../utils";
import { useI18nResolvedLanguage } from "./hooks";
import { supportedLanguages } from "../../model/i18n";
import { useTranslation } from "react-i18next";
import "./LanguageChooser.scss";

export const LanguageChooser: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("ide");
  const resolvedLanguage = useI18nResolvedLanguage();
  const setLanguage = useStoreActions(
    (actions) => actions.i18nContextState.setLanguage
  );

  const setLanguageFun = (lng: string) => () => setLanguage(lng);

  return (
    <div className="LanguageChooser gfs__help-content" tabIndex={0}>
      <Container className="help-text">
        <h1>{t("language-chooser.header")}</h1>
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
      </Container>
    </div>
  );
};
