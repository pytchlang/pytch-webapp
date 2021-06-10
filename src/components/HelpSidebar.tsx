import React from "react";
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
  return (
    <p>
      TODO: Help content. Lorem ipsum dolor sit amet, consectetur adipiscing
      elit. Vestibulum et vehicula diam, ac sagittis leo. Pellentesque eget eros
      pharetra, dignissim sapien vel, finibus augue. Sed interdum vehicula ex id
      consequat. Nulla bibendum nulla vitae nibh dictum, quis dignissim velit
      feugiat. Phasellus tortor nunc, blandit dictum lectus non, pharetra
      efficitur neque. Suspendisse vestibulum nulla sed ex pharetra, sed
      imperdiet enim dictum. Nulla a maximus massa. Morbi condimentum quis ipsum
      vel volutpat. Morbi sollicitudin dui lorem, volutpat mattis urna fermentum
      nec. Phasellus ut dui ex. Suspendisse dui libero, viverra finibus mattis
      et, semper ac leo. Suspendisse massa neque, ultrices et tincidunt eget,
      laoreet in velit. Phasellus in malesuada nibh, eget sagittis lorem. Mauris
      pharetra dolor vel dictum fermentum. Aliquam convallis magna at odio
      accumsan, non faucibus mauris venenatis. Proin quis lacus in libero
      vulputate rhoncus quis a dui. Etiam eu dictum diam. Mauris molestie sed
      orci ut posuere. Integer fringilla quam vel purus faucibus, fringilla
      egestas mi ultricies. Curabitur orci ex, suscipit quis tempor nec, finibus
      a quam. Praesent sit amet quam accumsan, suscipit ligula sed, ultrices
      ipsum. Phasellus a vehicula odio, non euismod augue. Pellentesque lacinia
      enim eget varius facilisis. Pellentesque non diam lacus. Proin maximus
      tempus consectetur. Sed gravida imperdiet consectetur. Nulla convallis
      quam metus, ac blandit risus posuere a. Suspendisse risus felis, pulvinar
      eu justo vitae, bibendum rhoncus lacus. Donec id efficitur elit. Praesent
      vitae fermentum diam. In sit amet magna id diam pretium pharetra quis non
      nisl. Donec iaculis elementum convallis. Aliquam convallis orci purus, vel
      venenatis sem eleifend ut. Nullam non metus vitae eros tincidunt venenatis
      non et erat. Aliquam erat volutpat. Curabitur vehicula, nulla mattis
      dignissim lobortis, purus augue convallis ipsum, non pellentesque tortor
      leo a nisl. Duis nec sapien blandit, feugiat nisi eu, tincidunt nisl.
      Aliquam erat volutpat. Fusce ultricies, erat ac lacinia venenatis, ligula
      tortor cursus lacus, sit amet ultricies nulla velit viverra libero.
      Pellentesque in tincidunt libero, tincidunt feugiat ipsum. Quisque nisi
      tellus, porta laoreet magna ac, viverra lobortis sem. Phasellus erat
      tellus, luctus vel mi at, mattis vestibulum leo. Pellentesque congue
      auctor eros, non porta ante dictum placerat. In hac habitasse platea
      dictumst. Etiam semper a nisi ut tempor. Nam congue malesuada
      sollicitudin. Phasellus feugiat enim non tristique pellentesque. Donec
      semper sapien et lectus convallis mattis. Cras gravida, orci quis sagittis
      hendrerit, sem metus hendrerit metus, et facilisis turpis urna non turpis.
    </p>
  );
};

export const HelpSidebar = () => {
  const { helpSidebar } = useStoreState((state) => state.ideLayout);
  const { toggleVisibility } = useStoreActions(
    (actions) => actions.ideLayout.helpSidebar
  );

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
