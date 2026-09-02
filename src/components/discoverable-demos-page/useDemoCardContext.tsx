import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import classNames from "classnames";
import { format } from "date-fns/format";
import { DemoCatalogueEntry } from "../../model/discoverable-demos-schema";
import { getProgramKindIcon, resetVideo } from "../../model/discoverable-demos";
import { useStoreActions } from "../../store";
import { DemoThumbnailContent } from "./DemoThumbnailContent";
import Markdown from "react-markdown";

/** Shared logic behind both demo-card variants (the recommended-carousel card
 * and the search-results card).
 *
 * It owns the hover/video-preview behaviour and the values derived from the
 * demo, and hands back a ready-to-render thumbnail plus the card event
 * handlers, so each variant only has to lay out its own markup. */
export function useDemoCardContext(demo: DemoCatalogueEntry) {
  const { t } = useTranslation("demos");
  const runCreateProjectFlow = useStoreActions(
    (actions) => actions.userConfirmations.createProjectFromDemoFlow.run
  );
  const createProject = () => runCreateProjectFlow({ uuid: demo.uuid });

  const [hover, setHover] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Showing the card (pointer over it or keyboard focus) starts the preview
  // video from the beginning; leaving it stops the preview.
  const enableVideo = () => {
    setHover(true);
    resetVideo(videoRef);
  };
  const disableVideo = () => {
    setHover(false);
  };

  const cardEventHandlers = {
    onMouseOver: enableVideo,
    onMouseOut: disableVideo,
    onFocus: enableVideo,
    onBlur: disableVideo,
  };

  const isGame = demo.demoKind === "game";
  const isSnippet = demo.demoKind === "snippet";

  const programKindIcon = getProgramKindIcon(demo.programKind);
  const demoKindName = t(`demo-kind.${demo.demoKind}`);
  const demoKindClassName = classNames(
    "ms-auto",
    "pill-demo-kind",
    { isGame },
    { isSnippet }
  );
  const absTimestamp = format(demo.lastUpdated, "PP");

  const thumbnail = (
    <DemoThumbnailContent
      demo={demo}
      hover={hover}
      setHover={setHover}
      videoRef={videoRef}
    />
  );

  const summaryPara = (
    <div className={"demo-description"}>
      <Markdown>{demo.summaryMarkdown}</Markdown>
    </div>
  );

  return {
    cardEventHandlers,
    thumbnail,
    createProject,
    programKindIcon,
    demoKindName,
    demoKindClassName,
    absTimestamp,
    summaryPara,
  };
}
