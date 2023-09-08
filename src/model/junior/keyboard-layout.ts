export type KeyDescriptor = {
  browserKeyName: string;
  displayName: string;
};

// TODO: Allow other keyboard layouts.
export const keyboardLayout: Array<Array<KeyDescriptor>> = (() => {
  const rawLayout = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"],
    [
      "space, ,5",
      "⇦,ArrowLeft,1",
      "⇩,ArrowDown,1",
      "⇧,ArrowUp,1",
      "⇨,ArrowRight,1",
    ],
  ];

  return rawLayout.map((row) =>
    row.map((descriptor) => {
      if (descriptor.length === 1) {
        return {
          browserKeyName: descriptor,
          displayName: descriptor,
        };
      }

      const [displayName, browserKeyName] = descriptor.split(",");
      return { browserKeyName, displayName };
    })
  );
})();

const _descriptorFromBrowserKeyName = (() => {
  let lut = new Map<string, KeyDescriptor>();
  keyboardLayout.forEach((row) =>
    row.forEach((keyDescriptor) => {
      lut.set(keyDescriptor.browserKeyName, keyDescriptor);
    })
  );
  return lut;
})();

export const descriptorFromBrowserKeyName = (
  browserKeyName: string
): KeyDescriptor => {
  const maybeDescriptor = _descriptorFromBrowserKeyName.get(browserKeyName);
  if (maybeDescriptor == null) {
    throw new Error(
      "could not find descriptor" + ` for browser-key "${browserKeyName}"`
    );
  }
  return maybeDescriptor;
};
