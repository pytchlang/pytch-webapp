import React from "react";
import { useTranslation } from "react-i18next";
import { Card, Carousel, Col, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useStoreActions, useStoreState } from "../../store";
import {
  DemoCatalogue,
  DemoCatalogueEntry,
} from "../../model/discoverable-demos-schema";
import { useDemoCardContext } from "./useDemoCardContext";
import { clampedIndex, recommendedDemos } from "../../model/discoverable-demos";
import { RenderedExternalContent } from "../RenderedExternalContent";

type RecommendedDemoCardProps = { demo: DemoCatalogueEntry };
const RecommendedDemoCard: React.FC<RecommendedDemoCardProps> = ({ demo }) => {
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

  return (
    <Card
      className={"recommended-card flex-sm-row card"}
      {...cardEventHandlers}
    >
      <Col
        xs={12}
        sm={6}
        md={6}
        className={
          "card-header-wrapper d-flex justify-content-center align-items-center p-1"
        }
      >
        <Card.Header className={"p-0 w-100 h-100"}>{thumbnail}</Card.Header>
      </Col>
      <Col xs={12} sm={6} md={6}>
        <Card.Body className={"p-3 px-4 d-flex flex-column"}>
          <Row className={"pill-row p-0 m-0 mb-3"}>
            <div className={"pill-icon flat-icon"}>
              <img src={programKindIcon.src} alt={programKindIcon.alt} />
            </div>
            <div className={demoKindClassName}>
              <p>{demoKindName}</p>
            </div>
          </Row>
          <Link to={""} onClick={createProject}>
            <h3>{demo.displayName}</h3>
          </Link>
          {summaryPara}
          <Row className={"footer-row"}>
            <Col sm={12} className={"d-flex justify-content-between"}>
              <p>{demo.authorName}</p>
              <p className={"m-0"}>{absTimestamp}</p>
            </Col>
          </Row>
        </Card.Body>
      </Col>
    </Card>
  );
};

type RecommendedDemosContentProps = { content: DemoCatalogue };
const RecommendedDemosContent: React.FC<RecommendedDemosContentProps> = ({
  content,
}) => {
  const { t } = useTranslation("demos");
  const storedRecommendedIndex = useStoreState(
    (state) => state.discoverableDemos.recommendedIndex
  );
  const setRecommendedIndex = useStoreActions(
    (actions) => actions.discoverableDemos.setRecommendedIndex
  );

  const demos = recommendedDemos(content);
  const recommendedIndex = clampedIndex(storedRecommendedIndex, demos.length);

  return (
    <div className={"row demos-recommended mb-5"}>
      <Row className={"pt-5 justify-content-between mb-3"}>
        <h2 className={"w-auto m-0"}>{t("recommended.heading")}</h2>
        <p className={"w-auto m-0 mt-auto"}>
          {recommendedIndex + 1}/{demos.length}
        </p>
      </Row>
      <Carousel
        activeIndex={recommendedIndex}
        onSelect={setRecommendedIndex}
        fade
        touch={true}
        slide={false}
        keyboard={true}
        className={"mb-5"}
        variant={"dark"}
        interval={null}
      >
        {demos.map((recommendedDemo) => (
          <Carousel.Item key={recommendedDemo.uuid}>
            <RecommendedDemoCard demo={recommendedDemo} />
          </Carousel.Item>
        ))}
      </Carousel>
    </div>
  );
};

export const RecommendedDemos = () => (
  <RenderedExternalContent
    fetchStateMapper={(state) =>
      state.discoverableDemos.fetchedDemos.contentFetchState
    }
    contentComponent={RecommendedDemosContent}
    resourceKeySuffix={false}
  />
);
