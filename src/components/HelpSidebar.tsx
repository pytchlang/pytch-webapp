import React, { useEffect } from "react";
import { useStoreState, useStoreActions } from "../store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  BlockElementDescriptor,
  ElementArray,
  HelpContentFromContext,
  HelpElementDescriptor,
  HelpSectionContent,
  NonMethodBlockElementDescriptor,
  PurePythonElementDescriptor,
  PythonCodeFromKind,
  showEntryInContext,
  useDevWorkContext,
} from "../model/help-sidebar";
import { highlightedPreEltsFromCode } from "../model/highlight-as-ace";
import { assertNever, EmptyProps, failIfNull } from "../utils";
import classNames from "classnames";
import { Spinner } from "react-bootstrap";
import { useHelpHatBlockDrag } from "./Junior/hooks";
import { EventDescriptor } from "../model/junior/structured-program";
import { DevWorkContext, DevWorkContextOps } from "../model/dev-work-context";
import {
  kFocusGroupItemClassName,
  focusGroupContainerClass,
} from "../model/junior/grouped-focus";
import { FocusContext } from "./hooks/focus-steering";
import { useNonNullContext } from "./hooks/non-null-context";

interface IScratchAndPython {
  eventDescriptor?: EventDescriptor;
  scratch: SVGElement;
  scratchIsLong: boolean;
  pythonToCopy?: string;
}

function helpElementsFromProps(props: {
  help: HelpContentFromContext;
  workContext: DevWorkContext;
}): ElementArray {
  const contextKey = DevWorkContextOps.asFlatKey(props.workContext);
  return failIfNull(
    props.help.get(contextKey),
    `no help content for kind "${contextKey}"`
  );
}

function pythonCodeFromProps(props: {
  python: PythonCodeFromKind;
  workContext: DevWorkContext;
}): string {
  const programKind = props.workContext.programKind;
  return failIfNull(
    props.python.get(programKind),
    `no Python code for kind "${programKind}"`
  );
}

type AccordionAngleSignifierProps = {
  wrap?: boolean;
};
const AccordionAngleSignifier: React.FC<AccordionAngleSignifierProps> = (
  props
) => {
  const wrap = props.wrap ?? false;

  const span = (
    <span className="accordion-signifier">
      <FontAwesomeIcon className="for-collapsed" icon="angle-right" />
      <FontAwesomeIcon className="for-expanded" icon="angle-down" />
    </span>
  );

  return wrap ? (
    <div className="accordion-signifier-container me-2">{span}</div>
  ) : (
    span
  );
};

const AccordionTextSignifier: React.FC<EmptyProps> = () => (
  <div className="help-item-text-signifier">
    <span className="for-collapsed">show more...</span>
    <span className="for-expanded">show less...</span>
  </div>
);

const ScratchBlockMaybeDraggable: React.FC<
  IScratchAndPython & { workContext: DevWorkContext }
> = (props) => {
  const scratchRef: React.RefObject<HTMLDivElement> = React.createRef();

  // Fudge to indicate whether dragging should be possible:
  const eventDescriptor =
    props.workContext.programKind === "per-method"
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

  return (
    <div className={dragDivClasses} ref={dragRef}>
      <div className="scratch-block-wrapper" ref={scratchRef} />
    </div>
  );
};

const HelpText: React.FC<{ help: ElementArray }> = (props) => {
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

  return <div className="help-text" ref={helpRef} />;
};

type HelpNodeSummaryProps = React.PropsWithChildren<object>;
const HelpNodeSummary: React.FC<HelpNodeSummaryProps> = ({ children }) => {
  const focusContext = useNonNullContext(FocusContext);
  return (
    <summary
      className={kFocusGroupItemClassName}
      tabIndex={-1}
      onClick={focusContext.onGroupItemClick}
    >
      {children}
    </summary>
  );
};

const BlockElement: React.FC<
  BlockElementDescriptor & { workContext: DevWorkContext }
> = (props) => {
  const helpElements = helpElementsFromProps(props);

  // This is a bit of a fudge but does the job.
  const hideDecorator =
    props.workContext.programKind === "per-method" &&
    props.python.startsWith("@pytch.when");

  const mHeader = (
    <h2 className="has-python">
      <AccordionAngleSignifier wrap />
      {!hideDecorator && (
        <code onClick={(ev) => ev.preventDefault()}>{props.python}</code>
      )}
    </h2>
  );

  return (
    <details className="pytch-method">
      <HelpNodeSummary>
        {mHeader}
        <ScratchBlockMaybeDraggable
          workContext={props.workContext}
          eventDescriptor={props.eventDescriptor}
          scratch={props.scratch}
          scratchIsLong={props.scratchIsLong}
          pythonToCopy={props.python}
        />
        <AccordionTextSignifier />
      </HelpNodeSummary>

      <HelpText help={helpElements} />
    </details>
  );
};

const NonMethodBlockElement: React.FC<
  NonMethodBlockElementDescriptor & { workContext: DevWorkContext }
> = (props) => {
  const helpElements = helpElementsFromProps(props);

  const populateHighlightedCode = (preElt: HTMLPreElement) => {
    if (preElt == null) return;
    if (preElt.hasAttribute("data-code-populated")) return;
    if (props.python == null) return; // Shouldn't happen
    const codeLineElts = highlightedPreEltsFromCode(props.python);
    codeLineElts.forEach((elt) => preElt.appendChild(elt));
    preElt.setAttribute("data-code-populated", "yes");
  };

  const maybePythonDiv =
    props.python == null ? null : (
      <div className="python" onClick={(ev) => ev.preventDefault()}>
        <pre
          className="help-sidebar-example-snippet"
          ref={populateHighlightedCode}
        />
      </div>
    );

  return (
    <details className="pytch-method">
      <HelpNodeSummary>
        <h2 className="non-method">
          <AccordionAngleSignifier wrap />
          {props.heading}
        </h2>

        {maybePythonDiv}

        <ScratchBlockMaybeDraggable
          workContext={props.workContext}
          scratch={props.scratch}
          scratchIsLong={false}
        />
        <AccordionTextSignifier />
      </HelpNodeSummary>

      <HelpText help={helpElements} />
    </details>
  );
};

const PythonAndButtons: React.FC<{
  python: string;
}> = (props) => (
  <>
    <h2 className="has-python">
      <AccordionAngleSignifier wrap />
      <code>{props.python}</code>
    </h2>
    <div className="python-with-buttons">
      <div />
    </div>
  </>
);

const PurePythonElement: React.FC<
  PurePythonElementDescriptor & { workContext: DevWorkContext }
> = (props) => {
  const helpElements = helpElementsFromProps(props);
  const pythonCode = pythonCodeFromProps(props);

  return (
    <details className="pytch-method">
      <HelpNodeSummary>
        <PythonAndButtons python={pythonCode} />
        <AccordionTextSignifier />
      </HelpNodeSummary>
      <HelpText help={helpElements} />
    </details>
  );
};

type HelpElementProps = {
  key: string;
  workContext: DevWorkContext;
};
const HelpElement: React.FC<HelpElementDescriptor & HelpElementProps> = (
  props
) => {
  if (!showEntryInContext(props.forActorKinds, props.workContext)) {
    return false;
  }

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
  workContext: DevWorkContext;
};

function sectionHasNoEntries(
  sectionSlug: string,
  entries: Array<HelpElementDescriptor>,
  workContext: DevWorkContext
): boolean {
  const noEntries = entries.every(
    (entry) => !showEntryInContext(entry.forActorKinds, workContext)
  );

  const expNoEntries =
    sectionSlug === "motion" &&
    workContext.programKind === "per-method" &&
    workContext.actorKind === "stage";

  if (noEntries !== expNoEntries)
    throw new Error(
      `noEntries=${noEntries} but expecting ${expNoEntries}` +
        ` for section "${sectionSlug}"` +
        ` in context "${JSON.stringify(workContext)}"`
    );

  return noEntries;
}

const HelpSidebarSection: React.FC<HelpSidebarSectionProps> = ({
  sectionSlug,
  sectionHeading,
  entries,
  workContext,
}) => {
  const workContextKey = DevWorkContextOps.asFlatKey(workContext);
  const renderedEntries = entries.map((entry, idx) => (
    <HelpElement
      key={`${sectionSlug}-${idx}-${workContextKey}`}
      {...entry}
      workContext={workContext}
    />
  ));

  const noEntries = sectionHasNoEntries(sectionSlug, entries, workContext);
  const content = noEntries ? (
    <p className="no-help-entries-help">The Stage has no motion methods.</p>
  ) : (
    renderedEntries
  );

  const categoryClass = `category-${sectionSlug}`;
  const className = classNames("HelpSidebarSection", categoryClass);
  return (
    <details className={className}>
      <HelpNodeSummary>
        <h1>
          <AccordionAngleSignifier />
          <span className="content">{sectionHeading}</span>
        </h1>
      </HelpNodeSummary>
      {content}
    </details>
  );
};

type HelpSidebarInnerContentProps = {
  workContext: DevWorkContext;
};
const HelpSidebarInnerContent: React.FC<HelpSidebarInnerContentProps> = ({
  workContext,
}) => {
  const focusContext = useNonNullContext(FocusContext);
  const contentFetchState = useStoreState(
    (state) => state.ideLayout.helpSidebar.contentFetchState
  );

  switch (contentFetchState.state) {
    case "idle":
    case "requesting":
      return (
        <div className="spinner-container">
          <Spinner animation="border" />
        </div>
      );
    case "available": {
      const helpContent = contentFetchState.content;

      const ctxString = DevWorkContextOps.asFlatKey(workContext);
      const groupedFocusKey = `HelpSidebar/${ctxString}`;

      return (
        <div
          ref={focusContext.groupContainerRefCallback()}
          className={focusGroupContainerClass("gfs__help__container")}
          data-grouped-focus-key={groupedFocusKey}
        >
          {helpContent.map((section) => (
            <HelpSidebarSection
              key={section.sectionSlug}
              sectionSlug={section.sectionSlug}
              sectionHeading={section.sectionHeading}
              entries={section.entries}
              workContext={workContext}
            ></HelpSidebarSection>
          ))}
        </div>
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
  const ensureHaveContent = useStoreActions(
    (actions) => actions.ideLayout.helpSidebar.ensureHaveContent
  );
  const displayContext = useDevWorkContext();

  useEffect(() => {
    ensureHaveContent();
  });

  return (
    <div className="HelpSidebar">
      <div className="content">
        <div className="inner-content">
          <HelpSidebarInnerContent workContext={displayContext} />
        </div>
      </div>
    </div>
  );
};
