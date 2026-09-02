import React, { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { DemoCatalogueEntry } from "../../model/discoverable-demos-schema";
import {
  demoThumbnailImageUrl,
  maybeDemoThumbnailVideoUrl,
} from "../../model/discoverable-demos";
import classNames from "classnames";
import Card from "react-bootstrap/Card";

type DemoThumbnailContentProps = {
  hover: boolean;
  setHover: (hover: boolean) => void;
  demo: DemoCatalogueEntry;
  videoRef: RefObject<HTMLVideoElement | null>;
};
export const DemoThumbnailContent: React.FC<DemoThumbnailContentProps> = ({
  hover,
  setHover,
  demo,
  videoRef,
}) => {
  const { t } = useTranslation("demos");
  const mVideoSrc = maybeDemoThumbnailVideoUrl(demo);
  const hasThumbnailVideo = mVideoSrc != null;
  const showVideo = hover && hasThumbnailVideo;
  const showImage = !showVideo;

  return (
    <>
      {hasThumbnailVideo ? (
        <video
          src={mVideoSrc}
          controls={false}
          autoPlay={true}
          muted={true}
          className={classNames("h-100 w-100 thumbnail-bg", {
            showVideo,
          })}
          onMouseOver={() => {
            setHover(true);
          }}
          onMouseOut={() => setHover(false)}
          controlsList="nofullscreen"
          ref={videoRef}
          tabIndex={-1}
        >
          {t("thumbnail.video-fallback")}
        </video>
      ) : null}
      <Card.Img
        variant={"top"}
        className={classNames("h-100 thumbnail-bg", { showImage })}
        src={demoThumbnailImageUrl(demo)}
      />
    </>
  );
};
