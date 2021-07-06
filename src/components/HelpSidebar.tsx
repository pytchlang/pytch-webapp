import React, { useEffect } from "react";
import { useStoreState, useStoreActions } from "../store";
import Button from "react-bootstrap/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  BlockElementDescriptor,
  HeadingElementDescriptor,
  HelpElementDescriptor,
  NonMethodBlockElementDescriptor,
  PurePythonElementDescriptor,
  scratchblocksScale,
} from "../model/help-sidebar";
import { assertNever } from "../utils";

const HeadingElement: React.FC<HeadingElementDescriptor> = (props) => {
  return <h1>{props.heading}</h1>;
};

interface IScratchAndPython {
  scratch: SVGElement;
  scratchIsLong: boolean;
  pythonToCopy?: string;
}

interface IToggleHelp {
  helpIsVisible: boolean;
  toggleHelp: () => void;
}

const MaybeCopyButton: React.FC<{ pythonToCopy?: string }> = (props) => {
  return props.pythonToCopy == null ? null : (
    <Button
      className="copy-button"
      variant="outline-success"
      onClick={() => {
        navigator.clipboard.writeText(props.pythonToCopy!);
      }}
    >
      <FontAwesomeIcon className="fa-lg" icon="copy" />
    </Button>
  );
};

const HelpToggleButton: React.FC<IToggleHelp> = (props) => {
  const helpButtonVariant = props.helpIsVisible ? "primary" : "outline-primary";
  return (
    <Button
      className="help-button"
      variant={helpButtonVariant}
      onClick={props.toggleHelp}
    >
      <FontAwesomeIcon className="fa-lg" icon="question-circle" />
    </Button>
  );
};

const ScratchAndButtons: React.FC<IScratchAndPython & IToggleHelp> = (
  props
) => {
  const scratchRef: React.RefObject<HTMLDivElement> = React.createRef();

  useEffect(() => {
    const scratchDiv = scratchRef.current;
    if (scratchDiv != null) {
      if (scratchDiv.hasAttribute("data-populated")) return;

      scratchDiv.appendChild(props.scratch);

      // Finish the scaling which was started when loading the content
      // in the ensureHaveContent() thunk.
      const scaleDimension = (attr: string): string => {
        const origValue = parseFloat(props.scratch.getAttribute(attr)!);
        const scaledValue = scratchblocksScale * origValue;
        return `${attr}:${scaledValue}px;`;
      };
      const styleForSize = ["width", "height"].map(scaleDimension).join("");
      const styleForOverflow = "overflow-x:clip;overflow-y:clip;";
      scratchDiv.setAttribute("style", styleForSize + styleForOverflow);

      scratchDiv.setAttribute("data-populated", "");
    }
  });

  const maybeLongClass = props.scratchIsLong ? " long" : "";
  return (
    <div className={`scratch-with-buttons${maybeLongClass}`}>
      <div className="scratch-block-wrapper" ref={scratchRef} />
      <div className="buttons">
        <HelpToggleButton {...props} />
        <MaybeCopyButton pythonToCopy={props.pythonToCopy} />
      </div>
    </div>
  );
};

const HelpText: React.FC<{ helpIsVisible: boolean; help: HTMLCollection }> = (
  props
) => {
  const helpVisibility = props.helpIsVisible ? "shown" : "hidden";
  const helpRef: React.RefObject<HTMLDivElement> = React.createRef();

  useEffect(() => {
    const helpDiv = helpRef.current;
    if (helpDiv != null) {
      if (helpDiv.hasAttribute("data-populated")) return;

      // Appending a child removes it from the collection it's part of, so
      // make clones of the original elements and append them instead.
      // Otherwise, roughly speaking, the help is populated the first time
      // it's rendered but not on subsequent renders.
      for (let i = 0; i < props.help.length; ++i)
        helpDiv.appendChild(props.help[i].cloneNode(true));

      helpDiv.setAttribute("data-populated", "");
    }
  });

  return <div className={`help-text ${helpVisibility}`} ref={helpRef} />;
};

const BlockElement: React.FC<
  BlockElementDescriptor & {
    toggleHelp: () => void;
  }
> = (props) => {
  return (
    <div className="pytch-method">
      <h2>
        <code>{props.python}</code>
      </h2>

      <ScratchAndButtons
        scratch={props.scratch}
        scratchIsLong={props.scratchIsLong}
        helpIsVisible={props.helpIsVisible}
        toggleHelp={props.toggleHelp}
        pythonToCopy={props.python}
      />

      <HelpText help={props.help} helpIsVisible={props.helpIsVisible} />
    </div>
  );
};

const NonMethodBlockElement: React.FC<
  NonMethodBlockElementDescriptor & {
    toggleHelp: () => void;
  }
> = (props) => {
  const maybePythonDiv =
    props.python == null ? null : (
      <div className="python">
        <pre>{props.python}</pre>
      </div>
    );

  return (
    <div className="pytch-method">
      <h2 className="non-method">{props.heading}</h2>

      <ScratchAndButtons
        scratch={props.scratch}
        scratchIsLong={false}
        helpIsVisible={props.helpIsVisible}
        toggleHelp={props.toggleHelp}
      />

      {maybePythonDiv}

      <HelpText help={props.help} helpIsVisible={props.helpIsVisible} />
    </div>
  );
};

const PythonAndButtons: React.FC<{
  python: string;
  helpIsVisible: boolean;
  toggleHelp: () => void;
}> = (props) => (
  <div className="python-with-buttons">
    <h2>
      <code>{props.python}</code>
    </h2>
    <div className="buttons">
      <HelpToggleButton {...props} />
      <MaybeCopyButton pythonToCopy={props.python} />
    </div>
  </div>
);

const PurePythonElement: React.FC<PurePythonElementDescriptor & IToggleHelp> = (
  props
) => {
  return (
    <div className="pytch-method">
      <PythonAndButtons {...props} />
      <HelpText help={props.help} helpIsVisible={props.helpIsVisible} />
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
    case "non-method-block":
      return <NonMethodBlockElement {...props} />;
    case "pure-python":
      return <PurePythonElement {...props} />;
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
