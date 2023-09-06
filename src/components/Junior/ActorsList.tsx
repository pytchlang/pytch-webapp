import React from "react";
import { Lorem } from "./Lorem";
import {
  AssetMetaDataOps,
  Uuid,
} from "../../model/junior/structured-program";
import { useStoreState } from "../../store";
import { AssetImageThumbnail } from "../AssetImageThumbnail";

type ActorThumbnailProps = { id: Uuid };
const ActorThumbnail: React.FC<ActorThumbnailProps> = ({ id }) => {
  const maybeFirstImage = useStoreState((state) =>
    AssetMetaDataOps.firstMatching(
      state.activeProject.project.assets,
      id,
      "image"
    )
  );

  const wrap = (content: JSX.Element) => (
    <div className="thumbnail">{content}</div>
  );

  if (maybeFirstImage == null) {
    return wrap(<div className="asset-preview">[No costumes]</div>);
  }

  if (maybeFirstImage.presentation.kind !== "image") {
    throw new Error(
      "expecting an image but presentation is of kind " +
        `"${maybeFirstImage.presentation.kind}"`
    );
  }

  return wrap(
    <AssetImageThumbnail
      image={maybeFirstImage.presentation.image}
      maxSize={60}
    />
  );
};

export const ActorsList = () => {
  return (
    <div className="Junior-ActorsList-container">
      <div className="abs-0000-oflow">
        <div className="ActorsList">
          <h2>ActorsList</h2>
          <Lorem />
        </div>
      </div>
    </div>
  );
};
