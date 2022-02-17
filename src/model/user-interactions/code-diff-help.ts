import { IModalUserInteraction, modalUserInteraction } from ".";
import { IPytchAppModel } from "..";

// It's a bit sledgehammer/nut to use this machinery for the simple
// "display code-diff help" modal, since there is no action to attempt,
// but doing so keeps the approach consistent.

export interface IDiffHelpSamples {
  unchanged: HTMLTableElement | null;
  deleted: HTMLTableElement | null;
  added: HTMLTableElement | null;
}
