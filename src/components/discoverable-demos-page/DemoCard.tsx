import React from "react";
import { Button, Card, Col, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { DemoCatalogueEntry } from "../../model/discoverable-demos-schema";
import { useStoreActions } from "../../store";
import { useFocusContext } from "../hooks/focus-steering";
import { focusGroupItemClass } from "../../model/junior/grouped-focus";
import { useDemoCardContext } from "./useDemoCardContext";

type DemoCardProps = {
  demo: DemoCatalogueEntry;
};

export const DemoCard: React.FC<DemoCardProps> = ({ demo }) => {
  const {
    cardEventHandlers,
    thumbnail,
    createProject,
    programKindIcon,
    demoKindName,
    demoKindClassName,
    absTimestamp,
    summaryPara,
  } = useDemoCardContext(demo);

  const setProgramKind = useStoreActions(
    (actions) => actions.discoverableDemos.searchFilters.setProgramKindSelector
  );
  const setDemoKind = useStoreActions(
    (actions) => actions.discoverableDemos.searchFilters.setDemoKindSelector
  );
  const searchForDemos = useStoreActions(
    (actions) => actions.discoverableDemos.searchForDemos
  );

  const focusContext = useFocusContext();

  const handleProgramKindPillClick = () => {
    setProgramKind(demo.programKind);
    searchForDemos();
  };

  const handleDemoKindPillClick = () => {
    setDemoKind(demo.demoKind);
    searchForDemos();
  };

  return (
    <Card
      className={focusGroupItemClass("flex-row flex-wrap card")}
      tabIndex={0}
      onClick={focusContext.onGroupItemClick}
      data-demo-uuid={demo.uuid}
      {...cardEventHandlers}
    >
      <Card.Header className={"p-0 w-100"}>
        <Row className={"pill-row w-100 p-3 m-0"}>
          <Button
            className={"pill-icon"}
            onClick={handleProgramKindPillClick}
            tabIndex={-1}
          >
            <img src={programKindIcon.src} alt={programKindIcon.alt} />
          </Button>
          <Button
            className={demoKindClassName}
            onClick={handleDemoKindPillClick}
            tabIndex={-1}
          >
            <p>{demoKindName}</p>
          </Button>
        </Row>
        <div className={"thumbnail-wrapper p-1"}>
          <div className={"thumbnail"}>{thumbnail}</div>
        </div>
      </Card.Header>
      <Card.Body className={"p-4 py-3"}>
        <Link
          to={""}
          onClick={(event) => {
            createProject();
            focusContext.onGroupItemClick(event);
          }}
          tabIndex={-1}
        >
          <h3>{demo.displayName}</h3>
        </Link>
        {summaryPara}

        <Row className={"share-row"}>
          <Col sm={12} className={"d-flex justify-content-between p-0"}>
            <p>{demo.authorName}</p>
            <p className={"m-0"}>{absTimestamp}</p>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};
