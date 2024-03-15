import React, { useEffect } from "react";
import NavBanner from "./NavBanner";
import Button from "react-bootstrap/Button";
import TutorialMiniCard from "./TutorialMiniCard";
import { EmptyProps, assertNever } from "../utils";
import { useStoreActions, useStoreState } from "../store";
import { urlWithinApp } from "../env-utils";
import { Link } from "./LinkWithinApp";
import { pytchResearchSiteUrl } from "../constants";
import { useSetActiveUiVersionFun } from "./hooks/active-ui-version";
import { EditorKindThumbnail } from "./EditorKindThumbnail";

const ToggleUiStylePanel_v1: React.FC<EmptyProps> = () => {
  const setUiVersion2 = useSetActiveUiVersionFun("v2");
  return (
    <div className="ToggleUiStylePanel">
      <div className="summary">
        <EditorKindThumbnail programKind="per-method" size="lg" />
        <div className="content">
          <p>
            We’re excited to invite you to try a new way of writing Pytch
            programs — script by script.
          </p>
        </div>
      </div>
      <div className="explanation">
        <p className="welcome-change-ui-style">
          <span className="pseudo-link" onClick={setUiVersion2}>
            Try it!
          </span>
        </p>
      </div>
    </div>
  );
};

const ToggleUiStylePanel_v2: React.FC<EmptyProps> = () => {
  const setUiVersion1 = useSetActiveUiVersionFun("v1");
  const createNewProjectAndNavigate = useStoreActions(
    (actions) => actions.projectCollection.createNewProjectAndNavigate
  );
  const createProjectFromTutorialAction = useStoreActions(
    (actions) => actions.tutorialCollection.createProjectFromTutorial
  );
  const setOperationState = useStoreActions(
    (actions) => actions.versionOptIn.setV2OperationState
  );

  // Bit of a fudge to manage the "operation in progress" state in the
  // next two functions, but it's likely to be temporary and so not
  // really worth making general.

  const createProject = async () => {
    setOperationState("in-progress");
    await createNewProjectAndNavigate({
      name: "Untitled script-by-script project",
      template: "simple-example-per-method",
    });
    setOperationState("idle");
  };

  const createProjectFromTutorial = async () => {
    setOperationState("in-progress");
    await createProjectFromTutorialAction("script-by-script-catch-apple");
    setOperationState("idle");
  };

  return (
    <div className="ToggleUiStylePanel">
      <div className="summary">
        <EditorKindThumbnail programKind="per-method" size="lg" />
        <div className="content">
          <p>
            Thanks for trying the <em>script by script</em> way of writing Pytch
            programs. Let us know what you think!
          </p>
        </div>
      </div>
      <div className="explanation">
        <p>You can try the new version by:</p>
        <ul>
          <li>
            <span className="pseudo-link" onClick={createProject}>
              Creating a project
            </span>{" "}
            which you edit as sprites and scripts.
          </li>
          <li>
            <span className="pseudo-link" onClick={createProjectFromTutorial}>
              Working with a tutorial
            </span>{" "}
            which leads you through writing a game as sprites and scripts.
          </li>
        </ul>
        <p>
          (Or you can{" "}
          <span className="pseudo-link" onClick={setUiVersion1}>
            go back to classic Pytch
          </span>
          .)
        </p>
      </div>
    </div>
  );
};

const ToggleUiStylePanel: React.FC<EmptyProps> = () => {
  const activeUiVersion = useStoreState(
    (state) => state.versionOptIn.activeUiVersion
  );

  switch (activeUiVersion) {
    case "v1":
      return <ToggleUiStylePanel_v1 />;
    case "v2":
      return <ToggleUiStylePanel_v2 />;
    default:
      return assertNever(activeUiVersion);
  }
};

const Welcome: React.FC<EmptyProps> = () => {
  // TODO: Replace the hard-coded list of tutorial mini-cards with something
  // driven by the pytch-tutorials repo.

  useEffect(() => {
    document.title = "Pytch";
  });

  const scratchLogoUrl = urlWithinApp("/assets/scratch-logo.png");
  const pythonLogoUrl = urlWithinApp("/assets/python-logo.png");

  return (
    // The style on the Python logo <img> is to make it the same width
    // as the Scratch logo, otherwise the text block is off-centre.
    <>
      <NavBanner />
      <div className="welcome-text">
        <div className="bridge-text-wrapper">
          <div className="bridge-text">
            <img src={scratchLogoUrl} alt="Scratch logo" />
            <div>
              <p>
                Pytch is a bridge from Scratch to Python. It helps people to
                learn Python by building on skills they have developed in
                Scratch.
              </p>
              <p>Questions or comments? Email us!</p>
              <p className="contact-email">
                <a href="mailto:info@pytch.org">
                  <code>info@pytch.org</code>
                </a>
              </p>
            </div>
            <img
              src={pythonLogoUrl}
              style={{ paddingRight: "64px" }}
              alt="Python snake"
            />
          </div>
        </div>

        <h2>Featured projects</h2>

        <div className="demo-cards">
          <TutorialMiniCard
            title="Catch a star"
            slug="chase"
            screenshotBasename="screenshot.png"
          >
            <p>
              In this introduction to coding in Pytch, you control a bird using
              the keyboard, and your job is to catch the star.
            </p>
          </TutorialMiniCard>

          <TutorialMiniCard
            title="Boing"
            slug="boing"
            screenshotBasename="summary-screenshot.png"
          >
            <p>
              In the game <i>Pong</i> from 1972, players hit a ball back and
              forth. Our <i>Boing</i> game, adapted from one in{" "}
              <a href="https://wireframe.raspberrypi.org/books/code-the-classics1">
                Code the Classics
              </a>
              , lets you play against the computer.
            </p>
          </TutorialMiniCard>

          <TutorialMiniCard
            title="Q*bert"
            slug="qbert"
            screenshotBasename="screenshot.png"
          >
            <p>
              Jump around a pyramid of blocks, trying to change the whole stack
              yellow without falling off! Our version is adapted from one in{" "}
              <a href="https://wireframe.raspberrypi.org/issues/42">
                Wireframe magazine
              </a>
              , inspired by the 1982 arcade classic.
            </p>
          </TutorialMiniCard>
        </div>

        <h2>Using Pytch</h2>

        <div className="way-of-using-pytch">
          <p className="button-wrapper">
            <Link to="/tutorials/">
              <Button variant="outline-primary">Tutorials</Button>
            </Link>
          </p>
          <p>
            If you’d like to learn how to make the games in{" "}
            <i>Featured projects</i> above, each one has its own tutorial,
            taking you step by step through the process of writing the code.
          </p>
        </div>

        <div className="way-of-using-pytch">
          <p className="button-wrapper">
            <Link to="/my-projects/">
              <Button variant="outline-primary">My projects</Button>
            </Link>
          </p>
          <p>
            If you’re already using Pytch on this device, you can continue
            working on one of your projects. Or, if you have a Pytch zipfile,
            you can upload it to continue working on your project.
          </p>
        </div>

        <h2>About Pytch</h2>

        <p>
          Pytch is part of a research project at Trinity College Dublin and TU
          Dublin, supported by Science Foundation Ireland. Pytch helps learners
          move from Scratch to Python.{" "}
          <a href={pytchResearchSiteUrl}>
            Learn more at the project’s website.
          </a>
        </p>

        <p>
          Please email us at{" "}
          <a href="mailto:info@pytch.org">
            <code>info@pytch.org</code>
          </a>{" "}
          with any feedback or questions.
        </p>

        <div className="logo-strip">
          <img src="assets/logos/TCD.png" alt="TCD logo" />
          <img src="assets/logos/TUD.png" alt="TUD logo" />
          <img src="assets/logos/SFI.png" alt="SFI logo" />
        </div>
      </div>
    </>
  );
};

export default Welcome;
