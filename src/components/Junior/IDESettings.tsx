import React from "react";
import { assertNever, EmptyProps } from "../../utils";
import {
  Row,
  Container,
  Spinner,
  InputGroup,
  Form,
  Button,
  Col,
} from "react-bootstrap";
import { Content } from "../../model/keyboard-shortcuts-help";
import { useStoreActions, useStoreState } from "../../store";

import "./IDESettings.scss";
import { LayoutStyle } from "../../model/ui";
import { LanguageChooser } from "./LanguageChooser";

const IDESettingsContent: React.FC<{ content: Content }> = () => {
  const fontSize = useStoreState((state) => state.ideLayout.codeEditorFontSize);
  const setFontSize = useStoreActions(
    (actions) => actions.ideLayout.setCodeEditorFontSize
  );

  const decrementFontSize = () => {
    setFontSize(fontSize - 3);
  };

  const incrementFontSize = () => {
    setFontSize(fontSize + 3);
  };

  const currentLayoutStyle = useStoreState(
    (state) => state.ideLayout.layoutStyle
  );
  const setLayoutStyle = useStoreActions(
    (actions) => actions.ideLayout.setLayoutStyle
  );

  return (
    <Container className={"d-flex flex-column h-100 w-100 mw-100 px-0 m-0"}>
      <Row className={"m-0"}>
        <h2 className={"pt-4 pb-3 px-3"}>Settings</h2>
        <Container>
          <Row>
            <Col xs={12}>
              <LanguageChooser />
            </Col>
            <Col xs={12}>
              <Form.Label id="font-size-label" htmlFor="editor-font-size">
                Code font size
              </Form.Label>
              <p id={"font-size-description"}>
                Set the font size of your code in the editing area.
              </p>
              <InputGroup className="mb-3">
                <Button
                  id="decrease-font-size"
                  aria-label={"Decrease font size"}
                  onClick={decrementFontSize}
                >
                  -
                </Button>
                <Form.Control
                  id="editor-font-size"
                  aria-describedby="font-size-description"
                  aria-label={"Font size"}
                  value={fontSize}
                  defaultValue={fontSize}
                  type={"number"}
                  min={9}
                  max={500}
                  step={1}
                  onInput={(fe) => {
                    setFontSize(Number(fe.currentTarget.value));
                  }}
                />
                <Button
                  id="increase-font-size"
                  aria-label={"Increase font size"}
                  onClick={incrementFontSize}
                >
                  +
                </Button>
              </InputGroup>
            </Col>
            <Col xs={12}>
              <Form.Label id="ide-layout-label" htmlFor="ide-layout">
                Layout
              </Form.Label>
              <div id={"ide-layout-description"}>
                <p>
                  Choose the{" "}
                  <abbr title={"Integrated Development Environment"}>IDE</abbr>
                  's layout and how many panes and areas are displayed at once.
                  The following options are available:
                </p>
                <ul className={"ps-5"}>
                  <li>
                    The <dfn>split screen layout</dfn> is activated by default
                    and show up to five expanded (help, coding, output/errors,
                    stage and project) areas at once.
                  </li>
                  <li>
                    The <dfn>single screen layout</dfn> consist of only the help
                    area and moves all the other areas inside of it. This layout
                    only shows one area/pane at a time.
                  </li>
                </ul>
              </div>
              <Form.Select
                aria-label="Layout"
                defaultValue={currentLayoutStyle}
                className={"px-3 mb-3"}
                aria-describedby="ide-layout-description"
                onChange={(e) => {
                  console.log("setting layout style");
                  setLayoutStyle(e.target.value as LayoutStyle);
                }}
              >
                <option value={"split-screen"}>Split screen</option>
                <option value={"single-screen-vertical"}>
                  Single screen (vertical)
                </option>
              </Form.Select>
            </Col>
          </Row>
        </Container>
      </Row>
    </Container>
  );
};

const IDESettingsMaybeContent: React.FC<EmptyProps> = () => {
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
        <IDESettingsContent content={contentState.contentFetchState.content} />
      );
    case "error":
      return (
        <>
          <h1>Problem</h1>
          <p>Sorry, there was a problem fetching the help information.</p>
        </>
      );
    default:
      return assertNever(contentState.contentFetchState);
  }
};

export const IDESettings: React.FC<EmptyProps> = () => {

  return (
    <div
      className="IDESettings gfs__help-content h-100 overflow-y-scroll"
      tabIndex={0}
    >
      <IDESettingsMaybeContent />
    </div>
  );
};
