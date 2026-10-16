import React, { ChangeEventHandler, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { NavBanner } from "../NavBanner";
import { EmptyProps, mDataAttrStringValue } from "../../utils";
import { Col, Container, Form, InputGroup, Row } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DemoCard } from "./DemoCard";
import { PaginationProvider } from "../PaginationProvider";
import { RecommendedDemos } from "./RecommendedDemos";
import {
  kDemoKindValues,
  SortBy,
  kSortByValues,
  DemoInLangCatalogue,
} from "../../model/discoverable-demos-schema";
import {
  DemoKindSelector,
  PytchProgramKindSelector,
  filteredSortedDemos,
  clampedPageNumber,
} from "../../model/discoverable-demos";
import { kPytchProgramKindValues } from "../../model/pytch-program-types";
import { FocusGroupContainer } from "../FocusGroupContainer";
import { createFocusContext, FocusContext } from "../hooks/focus-steering";
import { CreateProjectFromDemoModal } from "./CreateProjectFromDemoModal";
import {
  useDemoListActions,
  useDemoListState,
  useDemosForUiLanguage,
} from "./hooks";
import { useRunFlow } from "../../model";
import { RenderedExternalContent } from "../RenderedExternalContent";
import { useActionAsEffect } from "../hooks/use-action-as-effect";
import { useI18nResolvedLanguage } from "../Junior/hooks";

/** TODO The data files for the demos need to live not in this repo.  There
 * needs to be some machinery to support a reasonable workflow for
 * publishing new demos. */

const DemosHeader: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("demos");
  return (
    <div className={"demos-header pt-1 mb-2 border-bottom"}>
      <h1 className={"row pt-5"}>{t("page-heading")}</h1>
      <RecommendedDemos />
    </div>
  );
};

const DemosSearchField: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("demos");
  const searchFilters = useDemoListState((s) => s.searchFilters);
  const setDemoKindSelector = useDemoListActions((a) => a.setDemoKindSelector);

  const setSearchTerm = useDemoListActions((a) => a.setSearchTerm);

  const searchTermRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchTermRef.current?.focus();
  }, [searchFilters.searchTerm]);

  const handleChangeDemoKind: ChangeEventHandler<HTMLSelectElement> = (evt) => {
    setDemoKindSelector(evt.target.value as DemoKindSelector);
  };

  const handleChangeSearchTerm: ChangeEventHandler<HTMLInputElement> = (
    evt
  ) => {
    setSearchTerm(evt.target.value);
  };

  return (
    <div className="d-flex mb-3">
      <Form.Group className="me-4">
        <Form.Select
          key={"ProjectType"}
          aria-label={t("search.demo-kind.label")}
          value={searchFilters.demoKindSelector}
          className={"project-type"}
          onInput={handleChangeDemoKind}
        >
          <option value={"all"}>{t("search.demo-kind.all")}</option>
          {kDemoKindValues.map((demoKind) => (
            <option key={demoKind} value={demoKind}>
              {t(`demo-kind.${demoKind}`)}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group className="flex-grow-1">
        <Form.Label htmlFor={"search-field"} visuallyHidden={true}>
          {t("search.label")}
        </Form.Label>
        <InputGroup>
          <InputGroup.Text className={"search-icon"}>
            <FontAwesomeIcon icon={"search"} aria-hidden={true} />
          </InputGroup.Text>
          <Form.Control
            key={"searchField"}
            id={"search-field"}
            type={"search"}
            placeholder=""
            value={searchFilters.searchTerm}
            onInput={handleChangeSearchTerm}
            ref={searchTermRef}
          />
        </InputGroup>
      </Form.Group>
    </div>
  );
};

const DemosSearch: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("demos");
  const programKindSelector = useDemoListState(
    (s) => s.searchFilters.programKindSelector
  );
  const sortBy = useDemoListState((s) => s.sortBy);

  const setProgramKindSelector = useDemoListActions(
    (a) => a.setProgramKindSelector
  );
  const setSortBy = useDemoListActions((a) => a.setSortBy);

  const handleChangeSortBy: ChangeEventHandler<HTMLSelectElement> = (evt) => {
    setSortBy(evt.target.value as SortBy);
  };
  const handleChangeProgramKind: ChangeEventHandler<HTMLSelectElement> = (
    evt
  ) => {
    setProgramKindSelector(evt.target.value as PytchProgramKindSelector);
  };

  return (
    <>
      <Form className={"py-3"}>
        <Container className={"p-0"}>
          <Row className={"d-flex"}>
            <Col xs={12} md={5} className={"px-0"}>
              <DemosSearchField />
            </Col>
            <Col xs={12} md={7} className={"ms-auto"}>
              <Row>
                <Form.Group
                  className={"w-auto ms-auto"}
                  controlId={"formProgramType"}
                >
                  <Form.Label visuallyHidden={true}>
                    {t("program-kind.label")}
                  </Form.Label>
                  <Form.Select
                    aria-label={t("program-kind.label")}
                    className={"border-0"}
                    value={programKindSelector}
                    onInput={handleChangeProgramKind}
                  >
                    <option value={"all"}>{t("program-kind.label")}</option>
                    {kPytchProgramKindValues.map((programKind) => (
                      <option key={programKind} value={programKind}>
                        {t(`program-kind.${programKind}`)}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className={"w-auto"}>
                  <Form.Label visuallyHidden={true}>
                    {t("sort-by.label")}
                  </Form.Label>
                  <Form.Select
                    aria-label={t("sort-by.label")}
                    className={"border-0"}
                    onInput={handleChangeSortBy}
                    value={sortBy}
                  >
                    {Object.values(kSortByValues).map((sortingOption) => (
                      <option key={sortingOption} value={sortingOption}>
                        {t(`sort-by.${sortingOption}`)}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Row>
            </Col>
          </Row>
        </Container>
      </Form>
    </>
  );
};

const kDemosPerPage = 10;

type DemosResultContentProps = { content: DemoInLangCatalogue };
const DemosResultsContent: React.FC<DemosResultContentProps> = ({
  content,
}) => {
  const { t } = useTranslation("demos");
  const storedActivePage = useDemoListState((s) => s.activePage);
  const setActivePage = useDemoListActions((a) => a.setActivePage);
  const searchFilters = useDemoListState((s) => s.searchFilters);
  const sortBy = useDemoListState((s) => s.sortBy);
  const uiLanguage = useI18nResolvedLanguage();

  const demos = useDemosForUiLanguage(content);
  const searchResults = filteredSortedDemos(
    demos,
    searchFilters,
    sortBy,
    uiLanguage
  );

  const nFoundDemos = searchResults.length;
  const activePage = clampedPageNumber(
    storedActivePage,
    nFoundDemos,
    kDemosPerPage
  );
  const demosThisPage = searchResults.slice(
    (activePage - 1) * kDemosPerPage,
    activePage * kDemosPerPage
  );

  return (
    <Row className="p-3">
      {demosThisPage.map((demo) => (
        <Col key={demo.uuid} xs={12} sm={6} lg={4} className={"mb-5"}>
          <DemoCard demo={demo} />
        </Col>
      ))}
      {nFoundDemos === 0 ? (
        <Col className={"no-results"}>
          <p>{t("no-results")}</p>
        </Col>
      ) : undefined}
      <PaginationProvider
        activePage={activePage}
        setActivePage={setActivePage}
        nItems={nFoundDemos}
        itemsPerPage={kDemosPerPage}
      />
    </Row>
  );
};

const DemosContent: React.FC<EmptyProps> = () => {
  return (
    <Container>
      <Row className={"p-3"}>
        <DemosSearch />
      </Row>
      <RenderedExternalContent
        fetchStateMapper={(state) =>
          state.discoverableDemos.fetchedDemos.contentFetchState
        }
        contentComponent={DemosResultsContent}
        resourceKeySuffix="demos-catalogue"
      />
    </Container>
  );
};

export const DemosList: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("demos");
  const focusContext = createFocusContext("demos-list");

  useActionAsEffect(
    (actions) => actions.discoverableDemos.fetchedDemos.maybeLoadContent
  );

  const paneRef = React.useRef<HTMLDivElement>(null);

  const createProject = useRunFlow((f) => f.createProjectFromDemoFlow);

  useEffect(() => {
    document.title = t("page-title");
  });

  return (
    <>
      <CreateProjectFromDemoModal />
      <FocusContext value={focusContext}>
        <NavBanner />
        <div className="DemosList" tabIndex={-1} ref={paneRef}>
          <DemosHeader />
          <FocusGroupContainer
            className="demos-content p-xs-0"
            groupedFocusKey={`DemosList`}
            opts={{
              onFocusFromKeyboard: (elt: HTMLElement) =>
                elt.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                }),
              onActivate: (elt: HTMLElement) => {
                const mDemoUuid = mDataAttrStringValue(elt, "demoUuid");
                const mLanguage = mDataAttrStringValue(elt, "demoLanguage");
                if (mDemoUuid && mLanguage) {
                  createProject({ uuid: mDemoUuid, language: mLanguage });
                } else {
                  console.warn("no demo uuid or language found");
                }
              },
            }}
          >
            <DemosContent />
          </FocusGroupContainer>
        </div>
      </FocusContext>
    </>
  );
};
