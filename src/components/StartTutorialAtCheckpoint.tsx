import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { EmptyProps } from "../utils";
import { useFlowState, useRunFlow } from "../model";
import { asyncFlowModal } from "./async-flow-modals/utils";
import {
  assertNotAwaitingAck,
  settleFunctions,
} from "../model/user-interactions/async-user-flow";
import { Button, Card, Spinner } from "react-bootstrap";
import { ExceptionDisplay } from "./ExceptionDisplay";
import { InertNavBanner } from "./NavBanner";
import { ActionOrBusyButton } from "./async-flow-modals/ActionOrBusyButton";

const Content: React.FC<EmptyProps> = () => {
  const { fsmState } = useFlowState((f) => f.startTutorialAtCheckpointFlow);
  let lastErrorMessageRef = useRef<string>(null);

  // In the case of error, remember the message and display it even
  // after the async-user-flow has completed.  This avoids the user
  // looking at a mostly-blank page.

  if (fsmState.kind === "awaiting-ack-of-error")
    lastErrorMessageRef.current = fsmState.errorMessage;

  if (fsmState.kind === "idle" && lastErrorMessageRef.current != null)
    return (
      <ExceptionDisplay error={{ message: lastErrorMessageRef.current }} />
    );

  // Otherwise, handle as normal "modal".

  return asyncFlowModal(fsmState, (activeFsmState) => {
    // This flow specifies no modal notification.
    assertNotAwaitingAck("StartTutorialAtCheckpoint", activeFsmState);

    const { displaySummary, displayName, chapterIndex } =
      activeFsmState.runState;

    const summaryDivRef: React.Ref<HTMLDivElement> = (div) => {
      if (div == null || div.hasAttribute("data-populated")) return;
      displaySummary.forEach((node) => div.appendChild(node.cloneNode(true)));
      div.setAttribute("data-populated", "yes");
    };

    // TODO: Add difficulty badge and program-kind badge?

    return (
      <div className="TutorialList">
        <ul>
          <li>
            <Card
              data-slug={activeFsmState.runState.slug}
              className="TutorialCard start-at-chapter"
            >
              <Card.Header>
                <div className="tutorial-card-header">
                  <Card.Title as="h3" className="mt-2">
                    {displayName}
                  </Card.Title>
                </div>
                <p className="chapter-index-content text-center mt-3">
                  Starting at chapter {chapterIndex}
                </p>
              </Card.Header>
              <Card.Body>
                <div ref={summaryDivRef} />
                <p>
                  You will start this tutorial at the start of chapter{" "}
                  {chapterIndex}.
                </p>
              </Card.Body>
              <Card.Footer>
                <div className="button-bar">
                  <ActionOrBusyButton
                    flowState={activeFsmState}
                    isSubmittable={true}
                    interactingLabel="Create project" // TODO i18n
                  />
                </div>
              </Card.Footer>
            </Card>
          </li>
        </ul>
      </div>
    );
  });
};

export const StartTutorialAtCheckpoint: React.FC<EmptyProps> = () => {
  const params = useParams();
  const run = useRunFlow((f) => f.startTutorialAtCheckpointFlow);

  useEffect(() => {
    // Allow invalid slug or chapterIndex to get fed into the prepare()
    // or attempt() function of the flow.  If either of those throws an
    // error, it will be handled by the GenericErrorModal.
    //
    // In development mode, the run() will get called twice, and will
    // log a warning about "expecting idle but preparing".  Should not
    // happen in production build.
    //
    run({ mSlug: params.slug, mChapterIndexStr: params.chapterIndex });
  });

  return (
    <>
      <InertNavBanner />
      <div className="TutorialList single-tutorial">
        <h1>This tutorial was suggested for you:</h1>
        <Content />
      </div>
    </>
  );
};
