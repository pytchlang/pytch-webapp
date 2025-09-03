export type KeyOrShortcut = Parameters<typeof cy.realPress>[0];

export const kShiftTab: KeyOrShortcut = ["Shift", "Tab"];
export const kShiftF10: KeyOrShortcut = ["Shift", "F10"];

export function realPress(keyOrShortcut: KeyOrShortcut, nTimes?: number) {
  nTimes ??= 1;
  for (let _i = 0; _i !== nTimes; ++_i) {
    cy.realPress(keyOrShortcut);
  }
}
