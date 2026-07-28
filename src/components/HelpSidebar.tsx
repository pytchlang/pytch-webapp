import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useStoreState } from "../store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  BlockElementDescriptor,
  ElementArray,
  HelpContentFromContext,
  HelpElementDescriptor,
  HelpSectionContent,
  NonMethodBlockElementDescriptor,
  PurePythonElementDescriptor,
  RichPython,
  RichPythonFromKind,
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
import { kFocusGroupItemClassName } from "../model/junior/grouped-focus";
import { useFocusContext } from "./hooks/focus-steering";
import { FocusGroupContainer } from "./FocusGroupContainer";
import { useActionAsEffect } from "./hooks/use-action-as-effect";
import { ErrorFetchingSomething } from "./ErrorFetchingSomething";

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

function richPythonFromProps(props: {
  richPython: RichPythonFromKind;
  workContext: DevWorkContext;
}): RichPython {
  const programKind = props.workContext.programKind;
  return failIfNull(
    props.richPython.get(programKind),
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

const AccordionTextSignifier: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("ide");
  return (
    <div className="help-item-text-signifier">
      <span className="for-collapsed">{t("help-sidebar.show-more")}</span>
      <span className="for-expanded">{t("help-sidebar.show-less")}</span>
    </div>
  );
};

const ScratchBlockMaybeDraggable: React.FC<
  IScratchAndPython & { workContext: DevWorkContext }
> = (props) => {
  const scratchRef = React.useRef<HTMLDivElement>(null);

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
  const helpRef = React.useRef<HTMLDivElement>(null);

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
  const focusContext = useFocusContext();
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

const RichPythonCode: React.FC<{ richPython: RichPython }> = ({
  richPython,
}) => {
  return richPython.map((fragment, idx) => {
    switch (fragment.kind) {
      case "literal":
        // eslint-disable-next-line @eslint-react/no-array-index-key
        return <span key={idx}>{fragment.value}</span>;
      case "meta-var":
        return (
          // eslint-disable-next-line @eslint-react/no-array-index-key
          <span key={idx} className="meta-var">
            {fragment.name}
          </span>
        );
      default:
        return assertNever(fragment);
    }
  });
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
    <h3 className="has-python">
      <AccordionAngleSignifier wrap />
      {!hideDecorator && (
        <code onClick={(ev) => ev.preventDefault()}>
          <RichPythonCode richPython={props.richPython} />
        </code>
      )}
    </h3>
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

// This is clunky.  We want to mark some identifers as meta-variables,
// but also get the benefit of consistent syntax highlighting.  So the
// source JSON has identifiers of the form _MV_blah_blah_MV_ to signify
// a meta-variable, and the below function strips the _MV_ affixes and
// adds a class to that span.
const kMetaVarIdentifierRegExp = new RegExp("^_MV_(.*)_MV_$");
const patchMetaVars = (lineElt: HTMLPreElement): void => {
  let codeElt = lineElt.childNodes[0] as HTMLElement;
  codeElt.childNodes.forEach((child) => {
    const span = child as HTMLSpanElement;
    const text = span.innerText;
    const reMatches = kMetaVarIdentifierRegExp.exec(text);
    if (reMatches != null) {
      span.innerText = reMatches[1];
      span.removeAttribute("style");
      span.classList.add("meta-var");
    }
  });
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
    codeLineElts.forEach(patchMetaVars);
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
        <h3 className="non-method">
          <AccordionAngleSignifier wrap />
          {props.heading}
        </h3>

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
  richPython: RichPython;
}> = (props) => (
  <>
    <h3 className="has-python">
      <AccordionAngleSignifier wrap />
      <code>
        <RichPythonCode richPython={props.richPython} />
      </code>
    </h3>
    <div className="python-with-buttons">
      <div />
    </div>
  </>
);

const PurePythonElement: React.FC<
  PurePythonElementDescriptor & { workContext: DevWorkContext }
> = (props) => {
  const helpElements = helpElementsFromProps(props);
  const richPython = richPythonFromProps(props);

  return (
    <details className="pytch-method">
      <HelpNodeSummary>
        <PythonAndButtons richPython={richPython} />
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
      return (
        <li>
          <BlockElement {...props} />
        </li>
      );
    case "non-method-block":
      return (
        <li>
          <NonMethodBlockElement {...props} />
        </li>
      );
    case "pure-python":
      return (
        <li>
          <PurePythonElement {...props} />
        </li>
      );
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
      // eslint-disable-next-line @eslint-react/no-array-index-key
      key={`${sectionSlug}-${idx}-${workContextKey}`}
      {...entry}
      workContext={workContext}
    />
  ));

  const { t } = useTranslation("ide");
  const noEntries = sectionHasNoEntries(sectionSlug, entries, workContext);
  const content = noEntries ? (
    <p className="no-help-entries-help">{t("help-sidebar.stage-no-motion")}</p>
  ) : (
    renderedEntries
  );

  const categoryClass = `category-${sectionSlug}`;
  const className = classNames("HelpSidebarSection", categoryClass);
  return (
    <details className={className}>
      <HelpNodeSummary>
        <h2>
          <AccordionAngleSignifier />
          <span className="content">{sectionHeading}</span>
        </h2>
      </HelpNodeSummary>
      <ul className={"help-category-node"}>{content}</ul>
    </details>
  );
};

type HelpSidebarInnerContentProps = {
  workContext: DevWorkContext;
};
const HelpSidebarInnerContent: React.FC<HelpSidebarInnerContentProps> = ({
  workContext,
}) => {
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
        <>
          <h2 className={"pt-4 pb-3 px-3"}>Scratch/Python help</h2>
          <p className={"px-3"}>
            Here you can find different types of example code written in Python
            that you can use in your scripts to build your project. If you are
            familiar with Scratch blocks, you will find that most examples come
            with an image of their Scratch-version, whereas other examples are
            just common lines of code that are useful to know when programming.
          </p>
          <h3
            id={"help-categories"}
            className={"section-heading mx-3 px-3 py-2"}
          >
            Categories
          </h3>
          <FocusGroupContainer
            className="gfs__help__container"
            groupedFocusKey={groupedFocusKey}
          >
            <ul className={"help-categories"}>
              {helpContent.map((section) => (
                <li>
                  <HelpSidebarSection
                    key={section.sectionSlug}
                    sectionSlug={section.sectionSlug}
                    sectionHeading={section.sectionHeading}
                    entries={section.entries}
                    workContext={workContext}
                  ></HelpSidebarSection>
                </li>
              ))}
            </ul>
          </FocusGroupContainer>
        </>
      );
    }
    case "error":
      return <ErrorFetchingSomething resourceKeySuffix="help-sidebar" />;
    default:
      return assertNever(contentFetchState);
  }
};

export const HelpSidebar = () => {
  useActionAsEffect(
    (actions) => actions.ideLayout.helpSidebar.maybeLoadContent
  );
  const displayContext = useDevWorkContext();

  return (
    <div className="HelpSidebar">
      <div className="content h-100">
        <div className="inner-content h-100">
          <HelpSidebarInnerContent workContext={displayContext} />
        </div>
      </div>
    </div>
  );
};
