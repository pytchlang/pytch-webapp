import React from "react";
import classNames from "classnames";
import {
  AssetMetaDataOps,
  ActorKind,
  StructuredProgramOps,
  Uuid,
  ActorKindOps,
} from "../../model/junior/structured-program";
import { useStoreState } from "../../store";
import { AssetImageThumbnail } from "../AssetImageThumbnail";
import { AddSomethingSingleButton } from "./AddSomethingButton";
import {
  useJrEditActions,
  useJrEditState,
  useMappedProgram,
  useStructuredProgram,
} from "./hooks";
import { Dropdown } from "react-bootstrap";
import { ActorPropertiesTabKey } from "../../model/junior/edit-state";
import { SingleTab } from "../SingleTab";
import { CaptiveContextMenu } from "../CaptiveContextMenu";
import {
  kFocusGroupItemClassName,
  focusGroupContainerClass,
} from "../../model/junior/grouped-focus";
import { useFocusContext } from "../hooks/focus-steering";

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
  const runUpsertFlow = useJrEditActions((a) => a.upsertSpriteFlow.run);
  const existingNames = useMappedProgram(
    "RenameSpriteDropdownItem",
    (program) => StructuredProgramOps.spriteNames(program)
  );
  const doRename = () =>
    runUpsertFlow({
      upsertionAction: { kind: "update", actorId, previousName },
      existingNames,
    });

  return (
    <CaptiveContextMenu.DropdownItem onInvoke={doRename} disabled={!isAllowed}>
      Rename
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
  const focusContext = useFocusContext("per-method");
  const runDeleteActor = useJrEditActions((a) => a.deleteSpriteFlow.run);
  const activateTab = useJrEditActions((a) => a.setActorPropertiesActiveTab);
  const setFocusedActorAction = useJrEditActions((a) => a.setFocusedActor);

  const activateThisActor = () => setFocusedActorAction(id);

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
    });
  };

  const appearancesName = ActorKindOps.names(kind).appearancesDisplay;
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
    <CaptiveContextMenu.DropdownMenu>
      <CaptiveContextMenu.DropdownItem {...onInvokeProps("code")}>
        Go to code
      </CaptiveContextMenu.DropdownItem>
      <CaptiveContextMenu.DropdownItem {...onInvokeProps("appearances")}>
        Go to {appearancesName}
      </CaptiveContextMenu.DropdownItem>
      <CaptiveContextMenu.DropdownItem {...onInvokeProps("sounds")}>
        Go to sounds
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
        DELETE
      </CaptiveContextMenu.DropdownItem>
    </CaptiveContextMenu.DropdownMenu>
  );
};

type ActorCardProps = {
  isFocused: boolean;
  kind: ActorKind;
  id: Uuid;
  name: string;
};
const ActorCard: React.FC<ActorCardProps> = ({ isFocused, kind, id, name }) => {
  const focusContext = useFocusContext("per-method");
  const setFocusedActorAction = useJrEditActions((a) => a.setFocusedActor);
  const setFocusedActor = () => setFocusedActorAction(id);

  const className = classNames("ActorCard", `kind-${kind}`, { isFocused });
  return (
    <CaptiveContextMenu.Container
      className={kFocusGroupItemClassName}
      onClick={focusContext.onGroupItemClick}
      onActivate={setFocusedActor}
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
  const focusContext = useFocusContext("per-method");
  const program = useStructuredProgram("ActorsList()");
  const focusedActor = useJrEditState((s) => s.focusedActor);
  const runUpsertFlow = useJrEditActions((a) => a.upsertSpriteFlow.run);

  const existingNames = StructuredProgramOps.spriteNames(program);
  const launchAddSpriteModal = () => {
    runUpsertFlow({
      upsertionAction: { kind: "insert" },
      existingNames,
      onDispose: focusContext.onDisposeAddSprite(),
    });
  };

  const ariaLabel = "Stage, sprites";

  return (
    <section
      className="Junior-ActorsList-container compact-tablist-container"
      aria-label={ariaLabel}
    >
      <SingleTab title="Stage and sprites">
        <div className="abs-0000">
          <div
            ref={focusContext.groupContainerRefCallback()}
            className={focusGroupContainerClass("gfs__actors__container")}
            data-grouped-focus-key="ActorsList"
          >
            <ol className="ActorsList">
              {program.actors.map((a) => (
                <li key={a.id} className="Item-ActorCard">
                  <ActorCard
                    isFocused={a.id === focusedActor}
                    kind={a.kind}
                    id={a.id}
                    name={a.name}
                  />
                </li>
              ))}
            </ol>
            <AddSomethingSingleButton
              what="sprite"
              label="Add sprite"
              onClick={launchAddSpriteModal}
            />
          </div>
        </div>
      </SingleTab>
    </section>
  );
};
