import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { demoURLFromId } from "../storage/zipfile";
import { useStoreActions, useStoreState } from "../store";
import { NavBanner } from "./NavBanner";
import Button from "react-bootstrap/Button";
import { LoadingOverlay } from "./LoadingOverlay";
import { Link } from "./LinkWithinApp";
import { useParams } from "react-router-dom";
import { EmptyProps } from "../utils";
import { Card, Spinner } from "react-bootstrap";

export const DemoFromZipfileURL: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("tutorials");
  const params = useParams();
  const demoState = useStoreState((state) => state.demoFromZipfileURL.state);
  const boot = useStoreActions((actions) => actions.demoFromZipfileURL.boot);
  const createProject = useStoreActions(
    (actions) => actions.demoFromZipfileURL.createProject
  );
  const fail = useStoreActions((actions) => actions.demoFromZipfileURL.fail);

  useEffect(() => {
    if (demoState.state === "booting") {
      // Router behaviour should stop this happening, but check anyway:
      if (params.buildId == null || params.demoId == null) {
        fail("buildId or demoId is null");
      } else {
        const demoURL = demoURLFromId(`${params.buildId}/${params.demoId}`);
        boot(demoURL);
      }
    }
  });

  const isCreating = demoState.state === "creating";

  const content = (() => {
    switch (demoState.state) {
      case "booting":
      case "fetching":
        return (
          <div className="loading-placeholder text-center">
            <Spinner animation="border" className="my-3" />
          </div>
        );
      case "proposing":
      case "creating":
        return (
          <>
            <h1>{demoState.projectDescriptor.name}</h1>
            <div className="button-bar">
              <Button
                title={t("demo.button.title")}
                disabled={isCreating}
                variant="outline-primary"
                onClick={() => createProject()}
              >
                {t("demo.button.label")}
              </Button>
            </div>
          </>
        );
      case "error":
        return (
          <>
            <h1>{t("demo.problem.title")}</h1>
            <p>{t("demo.problem.message")}</p>
          </>
        );
      case "idle":
        // Might see this, if the user somehow manages to get back to
        // this URL even though we've navigate()d with "replace".
        return (
          <p>
            {t("demo.created-see")}{" "}
            <Link to="/my-projects/">{t("demo.my-projects-link")}</Link>.
          </p>
        );
    }
  })();

  return (
    <>
      <NavBanner />
      <div className="TutorialList single-tutorial">
        <h1>{t("demo.title")}</h1>
        <ul className="tutorial-list demo-only">
          <li>
            <LoadingOverlay show={isCreating}>
              <Spinner animation="border" className="my-3" />
            </LoadingOverlay>
            <Card body className="TutorialCard demo-only">
              {content}
            </Card>
          </li>
        </ul>
      </div>
    </>
  );
};
