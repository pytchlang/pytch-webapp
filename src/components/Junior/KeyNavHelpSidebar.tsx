import React from "react";
import { useTranslation } from "react-i18next";
import { markedParse } from "../hooks/sync-marked";
import { assertNever, EmptyProps } from "../../utils";
import { Row, Col, Container, Spinner } from "react-bootstrap";
import {
  Content,
  KeyDescriptor,
  Section,
  SectionEntry,
} from "../../model/keyboard-shortcuts-help";
import { useStoreState } from "../../store";
import { useActionAsEffect } from "../hooks/use-action-as-effect";
import { useDevWorkContext } from "../../model/help-sidebar";
import { ErrorFetchingSomething } from "../ErrorFetchingSomething";

import "./KeyNavHelpSidebar.scss";

function joinedList(
  keyDescrs: Array<KeyDescriptor>,
  joinText: string
): React.JSX.Element {
  let pieces: Array<React.JSX.Element> = [];
  keyDescrs.forEach((keyDescr, idx) => {
    // eslint-disable-next-line @eslint-react/no-array-index-key
    const keyElt = <Key key={idx} keyDescr={keyDescr} />;
    pieces.push(
      idx > 0 ? (
        // eslint-disable-next-line @eslint-react/no-array-index-key
        <div key={idx} className="d-inline-block">
          <span className="key-conj px-2">{joinText}</span>
          {keyElt}
        </div>
      ) : (
        keyElt
      )
    );
  });
  return <>{pieces}</>;
}

const Key: React.FC<{ keyDescr: KeyDescriptor }> = ({ keyDescr }) => {
  const { t } = useTranslation("ide");

  if (typeof keyDescr === "string") {
    return <kbd className="help-key">{keyDescr}</kbd>;
  }

  switch (keyDescr.kind) {
    case "chord": {
      const pieces = joinedList(keyDescr.keys, "+");
      return <span className="help-key-chord">{pieces}</span>;
    }
    case "alternatives": {
      const pieces = joinedList(keyDescr.keys, t("key-nav-help.key-conj.or"));
      return <span className="help-key-alternatives">{pieces}</span>;
    }
    case "respective": {
      const pieces = joinedList(keyDescr.keys, "/");
      return <span className="help-key-respective">{pieces}</span>;
    }
    case "sequence": {
      if (keyDescr.keys.length !== 2) {
        throw new Error("only 2-elt sequences are supported");
      }
      const pieces = joinedList(keyDescr.keys, t("key-nav-help.key-conj.then"));
      return <span className="help-key-sequence">{pieces}</span>;
    }
    default:
      return assertNever(keyDescr);
  }
};

const TextContent: React.FC<{ markdown: string }> = ({ markdown }) => {
  const html = markedParse(markdown);

  // We control the inputs so this is OK.
  // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

const ItemContent: React.FC<{ keyDescr: KeyDescriptor; help: string }> = ({
  keyDescr,
  help,
}) => {
  return (
    <Row className="ItemContent mb-3">
      <Col xs={5} className="key-descr text-end pe-1">
        <Key keyDescr={keyDescr} />
      </Col>
      <Col className="help-text-container">
        <span>:</span>
        <TextContent markdown={help} />
      </Col>
    </Row>
  );
};

const SectionEntryContent: React.FC<{ entry: SectionEntry }> = ({ entry }) => {
  switch (entry.kind) {
    case "text":
      return <TextContent markdown={entry.markdown} />;
    case "item":
      return <ItemContent keyDescr={entry.key} help={entry.help} />;
    default:
      return assertNever(entry);
  }
};

const SectionEntriesContent: React.FC<{
  entries: Array<SectionEntry>;
}> = ({ entries }) =>
  // eslint-disable-next-line @eslint-react/no-array-index-key
  entries.map((entry, idx) => <SectionEntryContent key={idx} entry={entry} />);

const SectionContent: React.FC<{ section: Section }> = ({ section }) => {
  const workContext = useDevWorkContext();

  const entryIsRelevant = (entry: SectionEntry) =>
    entry.forProgramKind == null ||
    entry.forProgramKind === workContext.programKind;

  const relevantEntries = section.entries.filter(entryIsRelevant);

  return (
    <div className="SectionContent mb-3">
      <Row className="section-heading">
        <h3>{section.heading}</h3>
      </Row>
      <SectionEntriesContent entries={relevantEntries} />
    </div>
  );
};

const KeyNavHelpSidebarContent: React.FC<{ content: Content }> = ({
  content,
}) => {
  const { t } = useTranslation("ide");
  const workContext = useDevWorkContext();

  const sectionIsRelevant = (section: Section) =>
    section.forProgramKind == null ||
    section.forProgramKind === workContext.programKind;

  const relevantSections = content.sections.filter(sectionIsRelevant);

  return (
    <>
      <h2 className={"pt-4 pb-3 px-3"}>{t("key-nav-help.title")}</h2>
      <Container className="help-text">
        <p>{t("key-nav-help.intro")}</p>
        {relevantSections.map((section, idx) => (
          // eslint-disable-next-line @eslint-react/no-array-index-key
          <SectionContent key={idx} section={section} />
        ))}
      </Container>
    </>
  );
};

const KeyNavHelpSidebarMaybeContent: React.FC<EmptyProps> = () => {
  const contentState = useStoreState(
    (s) => s.ideLayout.keyboardShortcutsHelpContent
  );
  switch (contentState.contentFetchState.state) {
    case "idle":
    case "requesting":
      return (
        <div className="spinner-container mt-3 text-center">
          <Spinner animation="border" />
        </div>
      );
    case "available":
      return (
        <KeyNavHelpSidebarContent
          content={contentState.contentFetchState.content}
        />
      );
    case "error":
      return <ErrorFetchingSomething resourceKeySuffix="keynavhelp" />;
    default:
      return assertNever(contentState.contentFetchState);
  }
};

export const KeyNavHelpSidebar: React.FC<EmptyProps> = () => {
  useActionAsEffect(
    (actions) => actions.ideLayout.keyboardShortcutsHelpContent.maybeLoadContent
  );

  return (
    <div className="KeyNavHelpSidebar gfs__help-content" tabIndex={0}>
      <KeyNavHelpSidebarMaybeContent />
    </div>
  );
};
