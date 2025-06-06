import React from "react";
import {
  ActorKind,
  AssetMimeType,
} from "../../model/junior/structured-program";
import {
  AssetPresentation,
  assetOperationContextFromKey,
} from "../../model/asset";
import { NoContentHelp } from "./NoContentHelp";
import { AssetCard } from "./AssetCard";
import classNames from "classnames";

type AssetsContentProps = {
  actorKind: ActorKind;
  assetKind: AssetMimeType;
  assets: Array<AssetPresentation>;
  buttonsPlural: boolean;
};

export const AssetsContent: React.FC<AssetsContentProps> = ({
  actorKind,
  assetKind,
  assets,
  buttonsPlural,
}) => {
  const operationContext = assetOperationContextFromKey(
    `${actorKind}/${assetKind}`
  );

  if (assets.length === 0) {
    // Add the same padding as in the CodeEditor, to avoid layout jitter
    // when switching between actor-property tabs.
    return (
      <div className="pt-2 pb-5">
        <NoContentHelp
          actorKind={actorKind}
          contentKind={operationContext.assetPlural}
          buttonsPlural={buttonsPlural}
        />
      </div>
    );
  }

  const canBeDeleted =
    operationContext.assetListCanBeEmpty || assets.length > 1;

  const classes = classNames(
    "Junior-AssetsList",
    `asset-kind-${assetKind}`,
    `actor-kind-${actorKind}`
  );

  return (
    <ol className={classes}>
      {assets.map((asset, idx) => (
        <li key={asset.name} className="Item-AssetCard">
          <AssetCard
            reorderingAllowed={true}
            assetKind={assetKind}
            operationScope={actorKind}
            displayIndex={idx}
            assetPresentation={asset}
            canBeDeleted={canBeDeleted}
            prevPathname={assets[idx - 1]?.name}
            nextPathname={assets[idx + 1]?.name}
          />
        </li>
      ))}
    </ol>
  );
};
