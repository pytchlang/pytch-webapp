import React, { useState, useEffect } from "react";
import NavBanner from "./NavBanner";
import TutorialCarousel from "./TutorialCarousel";
import SiteFooter from "./SiteFooter";
import { EmptyProps, assertNever } from "../utils";
import { useStoreActions, useStoreState } from "../store";
import { urlWithinApp } from "../env-utils";
import { useSetActiveUiVersionFun } from "./hooks/active-ui-version";
import { EditorKindThumbnail } from "./EditorKindThumbnail";
import { Modal, Button } from 'react-bootstrap';



function CodingJourneyModel() {
  const [showModal, setShowModal] = useState(false);
  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);
  const launchCreate = useStoreActions(
    (actions) => actions.userConfirmations.createProjectInteraction.launch
  );
  const showCreateModal = () => launchCreate();

  return (
    <>
      <Button variant="primary" onClick={handleShowModal} style={{ zIndex: 0 }} className="rounded-button divider">
        &gt;&gt;&gt; Start your <br /> coding journey
      </Button>
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>I want to...</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <button className="square" onClick={() => window.location.href = './tutorials'}>
            Start learning from basics with guided help and tutorials
          </button>
          <button onClick={showCreateModal} className="square">
            Start a new project and work on my own
          </button>
          {/*
        <div class="square">
           <p>View sample projects and learn from them</p>
        </div>
        */}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}


function OverviewModel() {
  const [showModal, setShowModal] = useState(false);
  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);
  const videoUrl = urlWithinApp("/assets/welcome/Overview.mp4");

  return (

    <section className="subgrid-video">
      <div id="myBtn" onClick={handleShowModal} aria-label="Video overview of Pytch">
        <svg
          fill="#fff"
          height="200px"
          width="200px"
          version="1.1"
          id="play_button"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 60 60"
          style={{ width: 200 }}
        >
          <g>
            <title>Click here for an overview of Pytch!</title>
            <path
              d="M45.563,29.174l-22-15c-0.307-0.208-0.703-0.231-1.031-0.058C22.205,14.289,22,14.629,22,15v30
              c0,0.371,0.205,0.711,0.533,0.884C22.679,45.962,22.84,46,23,46c0.197,0,0.394-0.059,0.563-0.174l22-15
              C45.836,30.64,46,30.331,46,30S45.836,29.36,45.563,29.174z M24,43.107V16.893L43.225,30L24,43.107z"
            />
            <path
              d="M30,0C13.458,0,0,13.458,0,30s13.458,30,30,30s30-13.458,30-30S46.542,0,30,0z M30,58C14.561,58,2,45.439,2,30
              S14.561,2,30,2s28,12.561,28,28S45.439,58,30,58z"
            />
          </g>
        </svg>
        {/* svgrepo */}
      </div>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
        </Modal.Header>
        <Modal.Body>
          <video className="w-100" controls loop>
            <source
              src={videoUrl}
              type="video/mp4"
            />
          </video>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </section>

  );
}


const ToggleUiStylePanel_v1: React.FC<EmptyProps> = () => {
  const setUiVersion2 = useSetActiveUiVersionFun("v2");
  return (
    <aside className="ToggleUiStylePanel">
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
    </aside>
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

  const logosUrl = urlWithinApp("/assets/welcome/Icon-02.png");
  const pytchUrl = urlWithinApp("/assets/welcome/normal-editor-preview-1024x693.png");
  const pytchjrUrl = urlWithinApp("/assets/welcome/script-by-script-preview-1-1024x693.png");
  const invadersUrl = urlWithinApp("/assets/welcome/invaders.png");

  return (

    <div className="welcometsx">
      <NavBanner />
      <header>
        <section>
          <h2>Welcome to Pytch!</h2>
          <p>Pytch is a bridge from Scratch to Python.</p>
          <p>
            It helps people to learn Python by building on skills they have developed
            in Scratch.
          </p>
        </section>

        <OverviewModel />

      </header>

      <CodingJourneyModel />

      <main>

        <ToggleUiStylePanel />

        <TutorialCarousel />

      </main>
      <section className="easy">
        <div className="section-heading">
          <img src={logosUrl} alt="" className="section-logo" />
          <h2>
            Learn Python <br /> with Pytch<span role="presentation">_</span>
          </h2>
        </div>
        <div className="section-content">
          <div className="section-buttons">
            <p>
              Here you can see what the Pytch environment looks like - providing a
              single screen where students can code, run their programs, and choose
              resources from our media library.
            </p>
          </div>
          <div className="cbody">
            <div className="cmain">
              <div className="ccontentwrap">
                <div className="ccontent">
                  <img className="ccont" src={invadersUrl} alt="" />
                </div>
              </div>
            </div>
            <div className="cbottom"></div>
            <div className="cleg"></div>
          </div>
        </div>
        <h2>Two ways of writing code</h2>
        <div className="section-content">
          <div>
            <img
              className="pytch_images"
              src={pytchjrUrl}
              width={512}
              height={360}
              alt="Pytch can be coded with script blocks"
            />
            <p className="caption">Script by script</p>
          </div>
          <div>
            <img
              className="pytch_images"
              src={pytchUrl}
              width={512}
              height={360}
              alt="Pytch can be coded as a single program"
            />
            <p className="caption">One big program</p>
          </div>
        </div>
      </section>
      <div className="section-buttons contact">
        <span style={{ paddingLeft: "10%" }}>
          <a className="mail" href="mailto:info@pytch.org">
            ✉
          </a>
        </span>
        <p className="large-text" style={{ paddingRight: "10%" }}>
          Please email us at{" "}
          <a style={{ color: "#000" }} href="mailto:info@pytch.org">
            info@pytch.org
          </a>{" "}
          with any feedback or suggestions
        </p>
      </div>
      <SiteFooter></SiteFooter>
    </div>

  );
};



export default Welcome;
