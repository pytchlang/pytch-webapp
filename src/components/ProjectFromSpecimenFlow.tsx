import React, { useEffect } from "react";
import { useStoreActions, useStoreState } from "../store";
import { EmptyProps, assertNever } from "../utils";
import { useParams } from "react-router-dom";
import { IProjectSummary } from "../model/projects";
import { NavBanner } from "./NavBanner";
import { Button, Card } from "react-bootstrap";
import { ContentLoadingSpinner } from "./Junior/ContentLoadingSpinner";
import { MtimeDisplay } from "./MtimeDisplay";
import { StartAfreshOption } from "../model/project-from-specimen";
import classNames from "classnames";
import { Trans, useTranslation } from "react-i18next";

// Styling for these is in the project-list.scss file.

const candidateClassname = (kind: "start-afresh" | "open-existing"): string =>
  classNames("project-from-specimen-candidate", "ProjectCard-wrapper", kind);

type CreateNewOptionCardProps = { option: StartAfreshOption };
const CreateNewOptionCard: React.FC<CreateNewOptionCardProps> = ({
  option,
}) => {
  const { t } = useTranslation("flows");
  const enactChoice = useStoreActions(
    (actions) => actions.projectFromSpecimenFlow.enactStartAfreshChoice
  );
  const startAfresh = () => {
    enactChoice(option);
  };

  return (
    <li
      className={candidateClassname("start-afresh")}
      data-start-afresh-kind={option.kind}
    >
      <Card className="ProjectCard" onClick={startAfresh}>
        <Card.Header>
          <Card.Title>{t("from-specimen.create-new")}</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="project-card-content">
            <div className="project-description">
              <p className="project-name">
                <em>{t("from-specimen.start-again-description")}</em>
              </p>
            </div>
            <div className="dropdown-wrapper">
              {/* Click on button passes up to <Card>'s handler. */}
              <Button>{t("from-specimen.start-again")}</Button>
            </div>
          </div>
        </Card.Body>
      </Card>
    </li>
  );
};

type OpenExistingOptionCardProps = {
  projectSummary: IProjectSummary;
};
const OpenExistingOptionCard: React.FC<OpenExistingOptionCardProps> = ({
  projectSummary,
}) => {
  const { t } = useTranslation("common");
  const enactChoice = useStoreActions(
    (actions) => actions.projectFromSpecimenFlow.enactExistingProjectChoice
  );
  const openExisting = () => {
    enactChoice(projectSummary);
  };

  return (
    <li
      className={candidateClassname("open-existing")}
      data-project-id={projectSummary.id}
    >
      <Card className="ProjectCard" onClick={openExisting}>
        <Card.Header>
          <Card.Title>{projectSummary.name}</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="project-card-content">
            <div className="project-description">
              <MtimeDisplay mtime={projectSummary.mtime} />
              {
                /* We'll omit the <P> for an empty summary; this is OK. */
                projectSummary.summary && (
                  <p className="project-summary">{projectSummary.summary}</p>
                )
              }
            </div>
            <div className="dropdown-wrapper">
              <Button>{t("button.open")}</Button>
            </div>
          </div>
        </Card.Body>
      </Card>
    </li>
  );
};

export const ProjectFromSpecimenFlow: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("flows");
  const params = useParams();

  const flowState = useStoreState(
    (state) => state.projectFromSpecimenFlow.state
  );
  const boot = useStoreActions(
    (actions) => actions.projectFromSpecimenFlow.boot
  );
  const fail = useStoreActions(
    (actions) => actions.projectFromSpecimenFlow.fail
  );

  useEffect(() => {
    console.log("ProjectFromSpecimenFlow.useEffect():", flowState.state);
    if (flowState.state === "not-yet-booted") {
      const relativePath = params["*"];
      if (relativePath == null) {
        fail();
        return;
      }

      boot(relativePath);
    }
  });

  const content = (() => {
    switch (flowState.state) {
      case "not-yet-booted":
      case "fetching":
      case "creating-new":
      case "redirecting":
        return (
          <div className="load-project-not-success pending">
            <ContentLoadingSpinner />
          </div>
        );

      case "awaiting-user-choice": {
        return (
          <>
            <h2>
              <Trans
                ns="flows"
                i18nKey="from-specimen.already-started"
                values={{ projectName: flowState.projectName }}
              />
            </h2>
            <h3>{t("from-specimen.open-fresh-copy")}</h3>
            <ol className="project-from-specimen-choices">
              <CreateNewOptionCard option={flowState.startAfreshOption} />
            </ol>
            <h3>{t("from-specimen.open-existing")}</h3>
            <ol className="project-from-specimen-choices">
              {flowState.existingProjectOptions.map((projectSummary) => (
                <OpenExistingOptionCard
                  key={projectSummary.id}
                  projectSummary={projectSummary}
                />
              ))}
            </ol>
          </>
        );
      }

      case "failed":
        return (
          <div className="load-project-not-success failed">
            <p>{t("from-specimen.failed")}</p>
          </div>
        );

      default:
        assertNever(flowState);
    }
  })();

  return (
    <>
      <NavBanner />
      <div className="ProjectList from-specimen">{content}</div>
    </>
  );
};
