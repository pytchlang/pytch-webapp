import React, { useEffect } from "react";
import { useStoreState, useStoreActions } from "../store";
import Button from "react-bootstrap/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  BlockElementDescriptor,
  ElementArray,
  HelpContentFromContext,
  HelpDisplayContext,
  HelpDisplayContextOps,
  HelpElementDescriptor,
  HelpSectionContent,
  NonMethodBlockElementDescriptor,
  PurePythonElementDescriptor,
  PythonCodeFromKind,
  showEntryInContext,
} from "../model/help-sidebar";
import { assertNever, copyTextToClipboard, failIfNull } from "../utils";
import classNames from "classnames";
import { Spinner } from "react-bootstrap";
import { IconName } from "@fortawesome/fontawesome-common-types";
import { useHelpHatBlockDrag } from "./Junior/hooks";
import { EventDescriptor } from "../model/junior/structured-program";

interface IScratchAndPython {
  eventDescriptor?: EventDescriptor;
  scratch: SVGElement;
  scratchIsLong: boolean;
  pythonToCopy?: string;
}

interface IToggleHelp {
  helpIsVisible: boolean;
  toggleHelp: () => void;
}

function helpElementsFromProps(props: {
  help: HelpContentFromContext;
  displayContext: HelpDisplayContext;
}): ElementArray {
  const contextKey = HelpDisplayContextOps.asString(props.displayContext);
  return failIfNull(
    props.help.get(contextKey),
    `no help content for kind "${contextKey}"`
  );
}

function pythonCodeFromProps(props: {
  python: PythonCodeFromKind;
  displayContext: HelpDisplayContext;
}): string {
  const programKind = props.displayContext.programKind;
  return failIfNull(
    props.python.get(programKind),
    `no Python code for kind "${programKind}"`
  );
}

const CopyButton: React.FC<{ pythonToCopy: string }> = ({ pythonToCopy }) => (
  <Button
    className="copy-button help-sidebar-button"
    variant="outline-success"
    onClick={() => {
      copyTextToClipboard(pythonToCopy);
    }}
  >
    <span>COPY</span>
    <FontAwesomeIcon icon="copy" />
  </Button>
);

const MaybeCopyButton: React.FC<{ pythonToCopy?: string }> = ({
  pythonToCopy,
}) => {
  return pythonToCopy == null ? null : (
    <CopyButton pythonToCopy={pythonToCopy} />
  );
};

const HelpToggleButton: React.FC<IToggleHelp> = (props) => {
  const iconName: IconName = props.helpIsVisible ? "angle-up" : "angle-down";
  return (
    <Button
      className="help-button help-sidebar-button"
      variant="outline-secondary"
      onClick={props.toggleHelp}
    >
      <span>HELP</span>
      <FontAwesomeIcon className="fa-lg" icon={iconName} />
    </Button>
  );
};

const ScratchAndButtons: React.FC<
  IScratchAndPython & IToggleHelp & { displayContext: HelpDisplayContext }
> = (props) => {
  const scratchRef: React.RefObject<HTMLDivElement> = React.createRef();

  // Fudge to indicate whether dragging should be possible:
  const eventDescriptor =
    props.displayContext.programKind === "per-method"
      ? props.eventDescriptor
      : undefined;

  // TODO: Should we do something with dragProps?
  const [, dragRef] = useHelpHatBlockDrag(eventDescriptor);

  useEffect(() => {
    const scratchDiv = scratchRef.current;
    if (scratchDiv != null) {
      if (scratchDiv.hasAttribute("data-populated")) return;

      scratchDiv.appendChild(props.scratch);

      scratchDiv.setAttribute("data-populated", "");
    }
  });

  const draggableHatBlock = eventDescriptor != null;
  const dragDivClasses = classNames({ draggableHatBlock });

  const maybeLongClass = props.scratchIsLong ? " long" : "";
  return (
    <div className={`scratch-with-buttons${maybeLongClass}`}>
      <div className={dragDivClasses} ref={dragRef}>
        <div className="scratch-block-wrapper" ref={scratchRef} />
      </div>
      <HelpToggleButton {...props} />
    </div>
  );
};

const HelpText: React.FC<{ helpIsVisible: boolean; help: ElementArray }> = (
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
    displayContext: HelpDisplayContext;
  }
> = (props) => {
  const helpElements = helpElementsFromProps(props);

  // This is a bit of a fudge but does the job.
  const hideDecorator =
    props.displayContext.programKind === "per-method" &&
    props.python.startsWith("@pytch.when");

  const mHeader = hideDecorator ? null : (
    <h2 className="has-python">
      <code>{props.python}</code>
      <MaybeCopyButton pythonToCopy={props.python} />
    </h2>
  );

  return (
    <div className="pytch-method">
      {mHeader}
      <ScratchAndButtons
        displayContext={props.displayContext}
        eventDescriptor={props.eventDescriptor}
        scratch={props.scratch}
        scratchIsLong={props.scratchIsLong}
        helpIsVisible={props.helpIsVisible}
        toggleHelp={props.toggleHelp}
        pythonToCopy={props.python}
      />

      <HelpText help={helpElements} helpIsVisible={props.helpIsVisible} />
    </div>
  );
};

const NonMethodBlockElement: React.FC<
  NonMethodBlockElementDescriptor & {
    toggleHelp: () => void;
    displayContext: HelpDisplayContext;
  }
> = (props) => {
  const helpElements = helpElementsFromProps(props);
  const maybePythonDiv =
    props.python == null ? null : (
      <div className="python">
        <pre>{props.python}</pre>
      </div>
    );

  return (
    <div className="pytch-method">
      <h2 className="non-method">{props.heading}</h2>

      {maybePythonDiv}

      <ScratchAndButtons
        displayContext={props.displayContext}
        scratch={props.scratch}
        scratchIsLong={false}
        helpIsVisible={props.helpIsVisible}
        toggleHelp={props.toggleHelp}
      />

      <HelpText help={helpElements} helpIsVisible={props.helpIsVisible} />
    </div>
  );
};

const PythonAndButtons: React.FC<{
  python: string;
  helpIsVisible: boolean;
  toggleHelp: () => void;
}> = (props) => (
  <>
    <h2 className="has-python">
      <code>{props.python}</code>
      <MaybeCopyButton pythonToCopy={props.python} />
    </h2>
    <div className="python-with-buttons">
      <div />
      <HelpToggleButton {...props} />
    </div>
  </>
);

const PurePythonElement: React.FC<
  PurePythonElementDescriptor &
    IToggleHelp & { displayContext: HelpDisplayContext }
> = (props) => {
  const helpElements = helpElementsFromProps(props);
  const pythonCode = pythonCodeFromProps(props);

  return (
    <div className="pytch-method">
      <PythonAndButtons
        python={pythonCode}
        helpIsVisible={props.helpIsVisible}
        toggleHelp={props.toggleHelp}
      />
      <HelpText help={helpElements} helpIsVisible={props.helpIsVisible} />
    </div>
  );
};

// It's a bit clumsy to accept a toggleHelp function for all elements,
// since not all elements use it.  E.g., a heading element has no
// toggle-help button.  But it does no real harm.
type HelpElementProps = {
  key: string;
  toggleHelp: () => void;
  displayContext: HelpDisplayContext;
};
const HelpElement: React.FC<HelpElementDescriptor & HelpElementProps> = (
  props
) => {
  if (!showEntryInContext(props.forActorKinds, props.displayContext))
    return false;

  switch (props.kind) {
    case "heading":
      // All "heading" entries should only have been used to create new
      // HelpSectionContent instances; they should not have ended up as
      // entries themselves.  See `groupHelpIntoSections()`.
      throw new Error('unexpected "heading" entry');
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

type HelpSidebarSectionProps = HelpSectionContent & {
  isExpanded: boolean;
  toggleSectionVisibility: () => void;
  toggleEntryHelp: (entryIndex: number) => () => void;
  displayContext: HelpDisplayContext;
};

const scrollRequest = (() => {
  let sectionSlug: string | null = null;

  const enqueue = (slug: string): void => {
    if (sectionSlug != null) {
      console.warn(
        `scrollRequest: enqueue("${slug}") while have "${sectionSlug}"`
      );
    }
    sectionSlug = slug;
  };

  const acquireIfMatch = (slug: string): boolean => {
    if (sectionSlug === slug) {
      sectionSlug = null;
      return true;
    } else {
      return false;
    }
  };

  return { enqueue, acquireIfMatch };
})();

function sectionHasNoEntries(
  sectionSlug: string,
  entries: Array<HelpElementDescriptor>,
  displayContext: HelpDisplayContext
): boolean {
  const noEntries = entries.every(
    (entry) => !showEntryInContext(entry.forActorKinds, displayContext)
  );

  const expNoEntries =
    sectionSlug === "motion" &&
    displayContext.programKind === "per-method" &&
    displayContext.actorKind === "stage";

  if (noEntries !== expNoEntries)
    throw new Error(
      `noEntries=${noEntries} but expecting ${expNoEntries}` +
        ` for section "${sectionSlug}"` +
        ` in context "${JSON.stringify(displayContext)}"`
    );

  return noEntries;
}

const HelpSidebarSection: React.FC<HelpSidebarSectionProps> = ({
  sectionSlug,
  sectionHeading,
  entries,
  isExpanded,
  toggleSectionVisibility,
  toggleEntryHelp,
  displayContext,
}) => {
  const categoryClass = `category-${sectionSlug}`;
  const className = classNames("HelpSidebarSection", categoryClass, {
    isExpanded,
  });

  const divRef: React.RefObject<HTMLDivElement> = React.createRef();

  useEffect(() => {
    if (
      divRef.current &&
      scrollRequest.acquireIfMatch(sectionSlug) &&
      isExpanded
    ) {
      divRef.current.scrollIntoView();
    }
  }, [divRef, sectionSlug, isExpanded]);

  const collapseOrExpandIcon = isExpanded ? "angle-up" : "angle-down";

  const displayContextString = HelpDisplayContextOps.asString(displayContext);

  // <HelpElement> can return false, to not render that entry.  The
  // entry-index is used to identify the entry within the section for
  // the expand/collapse action, so we have to maintain that
  // relationship.  (The alternative would have been to filter the
  // entries down to just the wanted ones and only create a shorter list
  // of <HelpElement>s, but that would lose the relationship between
  // index and entry.)
  const renderedEntries = entries.map((entry, idx) => (
    <HelpElement
      key={`${sectionSlug}-${idx}-${displayContextString}`}
      {...entry}
      toggleHelp={toggleEntryHelp(idx)}
      displayContext={displayContext}
    />
  ));

  const noEntries = sectionHasNoEntries(sectionSlug, entries, displayContext);
  const expandedContent = noEntries ? (
    <p className="no-help-entries-help">The Stage has no motion methods.</p>
  ) : (
    renderedEntries
  );

  return (
    <div className={className} ref={divRef}>
      <h1 onClick={toggleSectionVisibility}>
        <span className="content">{sectionHeading}</span>
        <span className="accordion-signifier">
          <FontAwesomeIcon icon={collapseOrExpandIcon} />
        </span>
      </h1>
      {isExpanded && expandedContent}
    </div>
  );
};

type HelpSidebarInnerContentProps = {
  displayContext: HelpDisplayContext;
};
export const HelpSidebarInnerContent: React.FC<
  HelpSidebarInnerContentProps
> = ({ displayContext }) => {
  const contentFetchState = useStoreState(
    (state) => state.ideLayout.helpSidebar.contentFetchState
  );
  const sectionVisibility = useStoreState(
    (state) => state.ideLayout.helpSidebar.sectionVisibility
  );
  const toggleSectionVisibilityAction = useStoreActions(
    (actions) => actions.ideLayout.helpSidebar.toggleSectionVisibility
  );
  const toggleHelpEntryVisibility = useStoreActions(
    (actions) => actions.ideLayout.helpSidebar.toggleHelpEntryVisibility
  );

  const toggleSectionVisibility = (slug: string) => {
    scrollRequest.enqueue(slug);
    toggleSectionVisibilityAction(slug);
  };

  switch (contentFetchState.state) {
    case "idle":
    case "requesting":
      return (
        <div className="spinner-container">
          <Spinner animation="border" />
        </div>
      );
    case "available": {
      const sectionIsExpanded = (slug: string) =>
        sectionVisibility.status === "one-visible" &&
        sectionVisibility.slug === slug;

      // The type here is a bit fiddly.  Each <HelpSidebarSection> needs
      // (as its toggleEntryHelp prop) a function which takes an
      // entry-index and returns a function suitable for use as an
      // onClick handler.  We want a function which creates such
      // functions from sectionIndex values.
      //
      const toggleEntryHelp =
        (sectionIndex: number) => (entryIndex: number) => () => {
          toggleHelpEntryVisibility({ sectionIndex, entryIndex });
        };

      const helpContent = contentFetchState.content;

      return (
        <>
          {helpContent.map((section, idx) => (
            <HelpSidebarSection
              key={section.sectionSlug}
              sectionSlug={section.sectionSlug}
              sectionHeading={section.sectionHeading}
              entries={section.entries}
              isExpanded={sectionIsExpanded(section.sectionSlug)}
              toggleSectionVisibility={() =>
                toggleSectionVisibility(section.sectionSlug)
              }
              toggleEntryHelp={toggleEntryHelp(idx)}
              displayContext={displayContext}
            ></HelpSidebarSection>
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
          <HelpSidebarInnerContent displayContext={{ programKind: "flat" }} />
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
