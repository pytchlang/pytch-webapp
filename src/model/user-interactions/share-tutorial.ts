import { Action, Thunk, action, thunk } from "easy-peasy";
import { IModalUserInteraction, modalUserInteraction, doNothing } from ".";
import { urlWithinApp } from "../../env-utils";

// It's a bit sledgehammer/nut to use this machinery for the simple
// "share tutorial" modal, since there is no action to attempt, but
// doing so keeps the approach consistent.

export function sharingUrlFromSlug(slug: string): string {
  return urlWithinApp(`/suggested-tutorial/${slug}`);
}

type IShareTutorialBase = IModalUserInteraction<void>;

type TutorialShareInfo = {
  slug: string;
  displayName: string;
};

interface IShareTutorialSpecific {
  slug: string;
  displayName: string;
  setSlug: Action<IShareTutorialSpecific, string>;
  setDisplayName: Action<IShareTutorialSpecific, string>;
  launch: Thunk<IShareTutorialBase & IShareTutorialSpecific, TutorialShareInfo>;
}

const shareTutorialSpecific: IShareTutorialSpecific = {
  slug: "",
  setSlug: action((state, slug) => {
    state.slug = slug;
  }),
  displayName: "",
  setDisplayName: action((state, name) => {
    state.displayName = name;
  }),
  launch: thunk((actions, info) => {
    actions.setSlug(info.slug);
    actions.setDisplayName(info.displayName);
    actions.superLaunch();
  }),
};

export type IShareTutorialInteraction = IShareTutorialBase &
  IShareTutorialSpecific;

export const shareTutorialInteraction = modalUserInteraction<
  void,
  IShareTutorialSpecific
>(doNothing, shareTutorialSpecific);
