import { Action, action, Thunk, thunk } from "easy-peasy";
import { batch } from "react-redux";
import { IModalUserInteraction, modalUserInteraction } from ".";
import { PytchAppModelActions } from "..";

// It's a bit sledgehammer/nut to use this machinery for the simple
// "display code-diff help" modal, since there is no action to attempt,
// but doing so keeps the approach consistent.

export interface IDiffHelpSamples {
  unchanged: HTMLTableElement | null;
  deleted: HTMLTableElement | null;
  added: HTMLTableElement | null;
}

type ICodeDiffHelpBase = IModalUserInteraction<void>;

interface ICodeDiffHelpSpecific {
  samples: IDiffHelpSamples;
  setSamples: Action<ICodeDiffHelpSpecific, IDiffHelpSamples>;
  launch: Thunk<ICodeDiffHelpBase & ICodeDiffHelpSpecific, IDiffHelpSamples>;
}

const doNothing = async (
  _actions: PytchAppModelActions,
  _descriptor: void
) => {};

const codeDiffHelpSpecific: ICodeDiffHelpSpecific = {
  samples: { unchanged: null, deleted: null, added: null },
  setSamples: action((state, samples) => {
    state.samples = samples;
  }),
  launch: thunk((actions, samples) => {
    batch(() => {
      actions.setSamples(samples);
      actions.superLaunch();
    });
  }),
};

export type ICodeDiffHelpInteraction = ICodeDiffHelpBase &
  ICodeDiffHelpSpecific;

export const codeDiffHelpInteraction = modalUserInteraction(
  doNothing,
  codeDiffHelpSpecific
);
