import React from "react";
import { assertNever, EmptyProps } from "../../utils";
import {
  Row,
  Container,
  Spinner,
  Carousel,
  Card,
  Accordion,
} from "react-bootstrap";
import { Content } from "../../model/keyboard-shortcuts-help";
import { useStoreState } from "../../store";

import "./activities/Activity.scss";
import codingArea from "../../images/ide-overview/coding-area.png";
import helpArea from "../../images/ide-overview/help-area.png";
import stageAndSpritesArea from "../../images/ide-overview/stage-and-sprites-area.png";
import { useJrEditActions } from "./hooks";

const IDEOverviewContent: React.FC<{ content: Content }> = () => {
  const expandAction = useJrEditActions((a) => a.expandActivityContent);

  return (
    <Container className={"d-flex flex-column h-100 w-100 mw-100 px-0 m-0"}>
      <Row className={"m-0"}>
        <h2 className={"pt-4 pb-3 px-3"}>User Interface overview</h2>
        <p>
          Welcome to Pytch's{" "}
          <dfn>
            <i>Integrated Development Environment</i> (
            <abbr title={"Integrated Development Environment"}>IDE</abbr>)
          </dfn>{" "}
          page! An <abbr title={"Integrated Development Environment"}>IDE</abbr>{" "}
          is software that is used to make coding easier. While you can write
          code in any text-editor, Pytch has helpful features that will make
          running, changing and fixing problems in your projects easier as you
          create them.
        </p>
      </Row>
      <Accordion className={"border-0 rounded-0"}>
        <Accordion.Item eventKey="0" className={"border-0 rounded-0"}>
          <Accordion.Header>
            <h3>Areas</h3>
          </Accordion.Header>
          <Accordion.Body>
            <p>
              There are three main panes in the default layout of Pytch's{" "}
              <abbr title={"Integrated Development Environment"}>IDE</abbr>: The{" "}
              <b>
                <dfn>activity</dfn>
              </b>{" "}
              pane, the{" "}
              <b>
                <dfn>coding</dfn>
              </b>{" "}
              pane and the{" "}
              <b>
                <dfn>stage and sprites</dfn>
              </b>{" "}
              pane.
            </p>
            <ul>
              <li>
                Activity pane: This pane has a bunch of information that might
                become useful throughout your work, including Scratch/Python
                example code, tutorials, lessons, project descriptions, keyboard
                navigation shortcuts and this overview. If you are using the
                single-screen layout of the IDE, the activity pane becomes the
                only pane on the screen and will contain all of the activities
                used to provide you with information, edit your project and see
                the results.
              </li>
              <li>
                Coding pane: In this pane you are able to change the behavior,
                look and sound of your project and its sprites.
              </li>
              <li>
                Stage and sprites pane: This pane allows you to run a preview of
                what your current project can do and gives you a list of all the
                sprites you are using in your project.
              </li>
            </ul>
            <Carousel
              variant={"dark"}
              className={"flex-grow-1"}
              interval={null}
              wrap={false}
              aria-label={"Area slideshow"}
            >
              <Carousel.Item>
                <Card className={"mx-auto"}>
                  <Card.Img
                    variant="bottom"
                    src={helpArea}
                    alt={
                      "The expanded activity pane displaying the example code panel."
                    }
                  />
                  <Card.Body>
                    <Card.Title>Activity pane</Card.Title>
                    {/*<Card.Text>*/}
                    {/*  This section has a bunch of information that might become*/}
                    {/*  useful throughout your work, including Scratch/Python*/}
                    {/*  example code, tutorials, lessons, project descriptions,*/}
                    {/*  keyboard navigation shortcuts and this overview panel!*/}
                    {/*</Card.Text>*/}
                  </Card.Body>
                </Card>
              </Carousel.Item>
              <Carousel.Item>
                <Card className={"mx-auto h-100"}>
                  <Card.Img
                    variant="bottom"
                    src={codingArea}
                    alt={
                      "The coding area with its 'Code' tab open. A script has been added inside of the tab and filled with one line of example code."
                    }
                  />
                  <Card.Body>
                    <Card.Title>Coding pane</Card.Title>
                    {/*<Card.Text>*/}
                    {/*  In this section you are able to change the behavior, look*/}
                    {/*  and sound of your project and its sprites.*/}
                    {/*</Card.Text>*/}
                  </Card.Body>
                </Card>
              </Carousel.Item>
              <Carousel.Item>
                <Card className={"mx-auto h-100"}>
                  <Card.Img
                    variant="bottom"
                    src={stageAndSpritesArea}
                    alt={
                      "The stage and sprites area. The top portion of the section is displaying a preview of a Pytch project while to bottom portion lists the stage and the sprite used to create the project."
                    }
                  />
                  <Card.Body>
                    <Card.Title>Stage and Sprites pane</Card.Title>
                    {/*<Card.Text>*/}
                    {/*  This section allows you to run a preview of what your*/}
                    {/*  current project can do and gives you a list of all the*/}
                    {/*  sprites you are using in your project.*/}
                    {/*</Card.Text>*/}
                  </Card.Body>
                </Card>
              </Carousel.Item>
            </Carousel>
          </Accordion.Body>
        </Accordion.Item>
        <Accordion.Item eventKey="1" className={"border-0 rounded-0"}>
          <Accordion.Header>
            <h3>Layouts</h3>
          </Accordion.Header>
          <Accordion.Body>
            <p>
              By default, Pytch uses a split-screen layout. Pytch has recently
              added new features to make navigating our IDE via keyboard easier.
              If you would like to learn more about our list of currently
              supported keyboard shortcuts to navigate around and between IDE
              sections, please have a look at our{" "}
              <button
                className={"btn btn-primary"}
                onClick={() => expandAction("info")}
              >
                Keyboard navigation help pane
              </button>
              .
            </p>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </Container>
  );
};

const IDEOverviewMaybeContent: React.FC<EmptyProps> = () => {
  const contentState = useStoreState(
    (s) => s.ideLayout.keyboardShortcutsHelpContent
  );
  switch (contentState.contentFetchState.state) {
    case "idle":
    case "requesting":
      return (
        <div className="spinner-container h-100 w-100 d-flex justify-content-center align-items-center">
          <Spinner animation="border" />
        </div>
      );
    case "available":
      return (
        <IDEOverviewContent content={contentState.contentFetchState.content} />
      );
    case "error":
      return (
        <>
          <h2>Problem</h2>
          <p>Sorry, there was a problem fetching the help information.</p>
        </>
      );
    default:
      return assertNever(contentState.contentFetchState);
  }
};

export const IDEOverview: React.FC<EmptyProps> = () => {
  return (
    <div
      className="IDEOverview gfs__help-content h-100 overflow-y-scroll"
      tabIndex={0}
    >
      <IDEOverviewMaybeContent />
    </div>
  );
};
