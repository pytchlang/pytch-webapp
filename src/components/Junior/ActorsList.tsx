import React from "react";
import { useTranslation } from "react-i18next";
import classNames from "classnames";
import {
  AssetMetaDataOps,
  ActorKind,
  Uuid,
  ActorOps,
} from "../../model/junior/structured-program";
import { useStoreState } from "../../store";
import { AssetImageThumbnail } from "../AssetImageThumbnail";
import { AddSomethingSingleButton } from "./AddSomethingButton";
import { useJrEditActions, useJrEditState, useActorNubs } from "./hooks";
import { Dropdown } from "react-bootstrap";
import { ActorPropertiesTabKey } from "../../model/junior/edit-state";
import { SingleTab } from "../SingleTab";
import { CaptiveContextMenu } from "../CaptiveContextMenu";
import { kFocusGroupItemClassName } from "../../model/junior/grouped-focus";
import { useFocusContext } from "../hooks/focus-steering";
import { FocusGroupContainer } from "../FocusGroupContainer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type ActorThumbnailProps = { id: Uuid };
const ActorThumbnail: React.FC<ActorThumbnailProps> = ({ id }) => {
  const { t } = useTranslation("ide");
  const maybeFirstImage = useStoreState((state) =>
    AssetMetaDataOps.firstMatching(
      state.activeProject.project.assets,
      id,
      "image"
    )
  );

  const wrap = (content: React.JSX.Element) => (
    <div className="thumbnail">{content}</div>
  );

  if (maybeFirstImage == null) {
    return wrap(<div className="asset-preview">{t("actor.no-costumes")}</div>);
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

type RenameSpriteDropdownItemProps = {
  isAllowed: boolean;
  actorId: Uuid;
  previousName: string;
};
const RenameSpriteDropdownItem: React.FC<RenameSpriteDropdownItemProps> = ({
  isAllowed,
  actorId,
  previousName,
}) => {
  const { t } = useTranslation("common");
  const focusContext = useFocusContext("per-method");
  const runUpsertFlow = useJrEditActions((a) => a.upsertSpriteFlow.run);
  const actorNubs = useActorNubs();
  const existingNames = ActorOps.spriteNames(actorNubs);
  const doRename = () =>
    runUpsertFlow({
      upsertionAction: { kind: "update", actorId, previousName },
      existingNames,
      onDispose: focusContext.onDisposeDeleteOrRenameSprite,
    });

  return (
    <CaptiveContextMenu.DropdownItem onInvoke={doRename} disabled={!isAllowed}>
      {t("action.rename")}
    </CaptiveContextMenu.DropdownItem>
  );
};

type ActorCardDropdownProps = {
  kind: ActorKind;
  name: string;
  id: Uuid;
};
const ActorCardDropdown: React.FC<ActorCardDropdownProps> = ({
  kind,
  name,
  id,
}) => {
  const { t } = useTranslation("ide");
  const { t: tCommon } = useTranslation("common");
  const focusContext = useFocusContext("per-method");
  const runDeleteActor = useJrEditActions((a) => a.deleteSpriteFlow.run);
  const activateTab = useJrEditActions((a) => a.setActorPropertiesActiveTab);
  const setActiveActorAction = useJrEditActions((a) => a.setActiveActor);

  const activateThisActor = () => setActiveActorAction(id);

  // You can only rename/delete sprites, not the stage.
  const canRenameOrDelete = kind === "sprite";

  // TODO: Add undo functionality for "delete sprite" action.
  const doDelete = () => {
    if (!canRenameOrDelete) {
      console.warn("ActorCardDropdown.doDelete(): should not be running");
      return;
    }

    runDeleteActor({
      spriteDisplayName: name,
      actorId: id,
      onDispose: focusContext.onDisposeDeleteOrRenameSprite,
    });
  };

  const onInvokeProps = (tab: ActorPropertiesTabKey) => ({
    onInvoke() {
      const seizeFocusKey = `ActorProperties/${id}/${tab}`;
      focusContext.focusBookmarkedItemOrQueue(seizeFocusKey);

      // For mouse usage, clicking on the dropdown toggle will have
      // already activated this actor, but for keyboard navigation, the
      // user might not have explicitly activated this actor before
      // launching the dropdown and choosing code/costumes/sounds.
      activateThisActor();

      activateTab(tab);
    },
  });

  return (
    <CaptiveContextMenu.DropdownMenu
      toggle={<FontAwesomeIcon icon={"caret-down"} />}
      // TODO: i18n
      ariaLabel={`Open ${
        kind === "stage" ? "the stage" : "this sprite's"
      } menu`}
    >
      <CaptiveContextMenu.DropdownItem {...onInvokeProps("code")}>
        {t("actor-action.go-to-code")}
      </CaptiveContextMenu.DropdownItem>
      <CaptiveContextMenu.DropdownItem {...onInvokeProps("appearances")}>
        {t(`actor-action.go-to-appearances.${kind}`)}
      </CaptiveContextMenu.DropdownItem>
      <CaptiveContextMenu.DropdownItem {...onInvokeProps("sounds")}>
        {t("actor-action.go-to-sounds")}
      </CaptiveContextMenu.DropdownItem>
      <Dropdown.Divider />
      <RenameSpriteDropdownItem
        actorId={id}
        isAllowed={canRenameOrDelete}
        previousName={name}
      />
      <CaptiveContextMenu.DropdownItem
        className="danger"
        onInvoke={doDelete}
        disabled={!canRenameOrDelete}
      >
        {tCommon("action.delete")}
      </CaptiveContextMenu.DropdownItem>
    </CaptiveContextMenu.DropdownMenu>
  );
};

type ActorCardProps = {
  isActive: boolean;
  kind: ActorKind;
  id: Uuid;
  name: string;
};
export const ActorCard: React.FC<ActorCardProps> = ({
  isActive,
  kind,
  id,
  name,
}) => {
  const focusContext = useFocusContext("per-method");
  const setActiveActorAction = useJrEditActions((a) => a.setActiveActor);
  const setActiveActor = () => setActiveActorAction(id);

  const className = classNames("ActorCard", `kind-${kind}`, { isActive });
  return (
    <CaptiveContextMenu.Container
      className={kFocusGroupItemClassName}
      onClick={focusContext.onGroupItemClick}
      onActivate={setActiveActor}
    >
      <div className={className} data-actor-id={id}>
        <div className="ActorCardContent">
          <ActorThumbnail id={id} />
          <div className="label">{name}</div>
        </div>
        <ActorCardDropdown kind={kind} name={name} id={id} />
      </div>
    </CaptiveContextMenu.Container>
  );
};

export const ActorsList = () => {
  const { t } = useTranslation("ide");
  const focusContext = useFocusContext("per-method");
  const actorNubs = useActorNubs();
  const activeActor = useJrEditState((s) => s.activeActor);
  const runUpsertFlow = useJrEditActions((a) => a.upsertSpriteFlow.run);

  const existingNames = ActorOps.spriteNames(actorNubs);
  const launchAddSpriteModal = () => {
    runUpsertFlow({
      upsertionAction: { kind: "insert" },
      existingNames,
      onDispose: focusContext.onDisposeAddSprite(),
    });
  };

  return (
    <section
      className="Junior-ActorsList-container h-100 w-100 compact-tablist-container"
      aria-label={t("per-method.pane-label.actors")}
    >
      <SingleTab title={t("per-method.tab-title.actors")}>
        <div className="abs-0000">
          <FocusGroupContainer
            className="gfs__actors__container"
            groupedFocusKey="ActorsList"
          >
            <ol className="ActorsList">
              {actorNubs.map((a) => (
                <li key={a.id} className="Item-ActorCard">
                  <ActorCard
                    isActive={a.id === activeActor}
                    kind={a.kind}
                    id={a.id}
                    name={a.name}
                  />
                </li>
              ))}
            </ol>
            <AddSomethingSingleButton
              what="sprite"
              label={t("actor-action.add")}
              onClick={launchAddSpriteModal}
            />
          </FocusGroupContainer>
        </div>
      </SingleTab>
    </section>
  );
};
