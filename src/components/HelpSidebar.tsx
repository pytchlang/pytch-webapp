import React, { useEffect } from "react";
import { useStoreState, useStoreActions } from "../store";
import Button from "react-bootstrap/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  BlockElementDescriptor,
  HeadingElementDescriptor,
  HelpElementDescriptor,
} from "../model/help-sidebar";
import { assertNever } from "../utils";

const HeadingElement: React.FC<HeadingElementDescriptor> = (props) => {
  return <h1>{props.heading}</h1>;
};

const BlockElement: React.FC<
  BlockElementDescriptor & {
    toggleHelp: () => void;
  }
> = (props) => {
  const helpVisibility = props.helpIsVisible ? "shown" : "hidden";
  const helpButtonVariant = props.helpIsVisible ? "primary" : "outline-primary";

  const copyPython = () => {
    navigator.clipboard.writeText(props.python);
  };

  return (
    <div className="pytch-method">
      <h2>
        <code>{props.python}</code>
      </h2>

      <div className="scratch-with-buttons">
        <div className="scratch-block-wrapper">TODO: Scratchblocks.</div>
        <div className="buttons">
          <Button
            className="help-button"
            variant={helpButtonVariant}
            onClick={props.toggleHelp}
          >
            <FontAwesomeIcon className="fa-lg" icon="question-circle" />
          </Button>
          <Button
            className="copy-button"
            variant="outline-success"
            onClick={copyPython}
          >
            <FontAwesomeIcon className="fa-lg" icon="copy" />
          </Button>
        </div>
      </div>

      <div className={`help-text ${helpVisibility}`}>
        TODO: Convert from Markdown: "{props.help}".
      </div>
    </div>
  );
};

// It's a bit clumsy to accept a toggleHelp function for all elements,
// since not all elements use it.  E.g., a heading element has no
// toggle-help button.  But it does no real harm.
const HelpElement: React.FC<
  HelpElementDescriptor & { key: number; toggleHelp: () => void }
> = (props) => {
  switch (props.kind) {
    case "heading":
      return <HeadingElement {...props} />;
    case "block":
      return <BlockElement {...props} />;
    default:
      return assertNever(props);
  }
};

const HelpSidebarInnerContent = () => {
  const contentFetchState = useStoreState(
    (state) => state.ideLayout.helpSidebar.contentFetchState
  );
  const toggleHelpItemVisibility = useStoreActions(
    (actions) => actions.ideLayout.helpSidebar.toggleHelpItemVisibility
  );

  switch (contentFetchState.state) {
    case "idle":
    case "requesting":
      return <h1>Loading help...</h1>;
    case "available": {
      const toggleHelp = (idx: number) => () => {
        toggleHelpItemVisibility(idx);
      };
      return (
        <>
          {contentFetchState.content.map((entry, idx) => (
            <HelpElement {...entry} toggleHelp={toggleHelp(idx)} key={idx} />
          ))}
        </>
      );
    }
    case "error":
    default:
      return (
        <>
          <h1>Problem</h1>
          <p>Sorry, there was a problem fetching the help information.</p>
        </>
      );
  }
};

export const HelpSidebar = () => {
  const { helpSidebar } = useStoreState((state) => state.ideLayout);
  const { toggleVisibility, ensureHaveContent } = useStoreActions(
    (actions) => actions.ideLayout.helpSidebar
  );

  useEffect(() => {
    ensureHaveContent();
  });

  const visibilityClass = helpSidebar.isVisible ? "shown" : "hidden";

  return (
    <div className={`content-wrapper ${visibilityClass}`}>
      <Button
        variant="outline-secondary"
        className="dismiss-help"
        onClick={() => toggleVisibility()}
      >
        <p>
          <FontAwesomeIcon className="fa-lg" icon={["far", "times-circle"]} />
        </p>
      </Button>
      <div className="content">
        <div className="inner-content">
          <HelpSidebarInnerContent />
        </div>
      </div>
    </div>
  );
};

export const HelpSidebarOpenControl = () => {
  const isVisible = useStoreState(
    (state) => state.ideLayout.helpSidebar.isVisible
  );
  const { toggleVisibility } = useStoreActions(
    (actions) => actions.ideLayout.helpSidebar
  );

  return isVisible ? null : (
    <div className="control" onClick={() => toggleVisibility()}>
      <p>
        <FontAwesomeIcon icon="question-circle" />
      </p>
    </div>
  );
};
