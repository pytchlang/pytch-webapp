import React, { CSSProperties, useState } from "react";
import { EmptyProps } from "../../utils";
import { welcomeAssetUrl } from "./utils";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { useRunFlow } from "../../model";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./CodingJourney.scss";
import { Trans, useTranslation } from "react-i18next";
import { SectionWithHiddenH2 } from "../SectionWithHiddenH2";

type CodingJourneysModalProps = {
  isShown: boolean;
  dismiss: () => void;
};
const CodingJourneysModal: React.FC<CodingJourneysModalProps> = ({
  isShown,
  dismiss,
}) => {
  const { t: tWelcome } = useTranslation("welcome");
  const { t: tCommon } = useTranslation("common");
  const { t: tProjects } = useTranslation("projects");
  const navigate = useNavigate();
  const runCreateProjectFlow = useRunFlow((f) => f.createProjectFlow);
  const createArgs = { initialName: tProjects("create.initial-name") };
  const runCreateProject = () => runCreateProjectFlow(createArgs);

  const narrowWarningHeading = tWelcome(
    "coding-journey.modal.narrow-screen-warning-heading"
  );

  return (
    <Modal
      className="CodingJourneysModal"
      centered={true}
      show={isShown}
      onHide={dismiss}
      animation={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>{tWelcome("coding-journey.modal.title")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <SectionWithHiddenH2
          className="narrow-screen-warning"
          headingContent={narrowWarningHeading}
        >
          <p className="icon">
            <FontAwesomeIcon icon="exclamation-triangle" />
          </p>
          <p className="text-content">
            {tWelcome("coding-journey.modal.narrow-screen-warning")}
          </p>
        </SectionWithHiddenH2>
        <Button onClick={() => navigate("tutorials/")}>
          {tWelcome("coding-journey.modal.button.tutorials")}
        </Button>
        <Button
          onClick={() => {
            dismiss();
            runCreateProject();
          }}
        >
          {tWelcome("coding-journey.modal.button.new-project")}
        </Button>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={dismiss}>
          {tCommon("button.ok")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export const CodingJourney: React.FC<EmptyProps> = () => {
  const [modalShown, setModalShown] = useState(false);

  // Supply background-image here to ensure correct behaviour if app
  // entered via non-root route.
  const contentStyle: CSSProperties = {
    backgroundImage: `url(${welcomeAssetUrl("swirls-and-icons.png")})`,
  };

  return (
    <>
      <div className="CodingJourney">
        <div className="separator" />
        <div
          className="button"
          style={contentStyle}
          onClick={() => setModalShown(true)}
        >
          <div className="hover-darken" />
          <p className="label-text">
            <Trans
              ns="welcome"
              i18nKey="coding-journey.button.label"
              components={{ br: <br /> }}
            />
          </p>
        </div>
      </div>
      <CodingJourneysModal
        isShown={modalShown}
        dismiss={() => setModalShown(false)}
      />
    </>
  );
};
