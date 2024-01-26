import { Action, Thunk, thunk } from "easy-peasy";
import { IModalUserInteraction, modalUserInteraction, doNothing } from ".";
import { urlWithinApp } from "../../env-utils";
import { propSetterAction } from "../../utils";

// It's a bit sledgehammer/nut to use this machinery for the simple
// "share tutorial" modal, since there is no action to attempt, but
// doing so keeps the approach consistent.

export function sharingUrlFromSlug(slug: string): string {
  const baseUrl = "/suggested-tutorial";
  return sharingUrlFromUrlComponents(baseUrl, slug);
}

export function sharingUrlFromSlugForDemo(slug: string): string {
  const baseUrl = "/suggested-tutorial-demo";
  return sharingUrlFromUrlComponents(baseUrl, slug);
}

function sharingUrlFromUrlComponents(baseUrl: string, slug: string) {
  return urlWithinApp(`${baseUrl}/${slug}`);
}

type IShareTutorialBase = IModalUserInteraction<void>;

type TutorialShareInfo = {
  slug: string;
  displayName: string;
};

interface IShareTutorialSpecific {
  info: TutorialShareInfo;
  setInfo: Action<IShareTutorialSpecific, TutorialShareInfo>;
  launch: Thunk<IShareTutorialBase & IShareTutorialSpecific, TutorialShareInfo>;
}

const shareTutorialSpecific: IShareTutorialSpecific = {
  info: { slug: "", displayName: "", programKind: "flat" },
  setInfo: propSetterAction("info"),
  launch: thunk((actions, info) => {
    actions.setInfo(info);
    actions.superLaunch();
  }),
};

export type IShareTutorialInteraction = IShareTutorialBase &
  IShareTutorialSpecific;

export const shareTutorialInteraction = modalUserInteraction<
  void,
  IShareTutorialSpecific
>(doNothing, shareTutorialSpecific);
