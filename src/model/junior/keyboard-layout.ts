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
    ["space, ", "⇦,ArrowLeft", "⇩,ArrowDown", "⇧,ArrowUp", "⇨,ArrowRight"],
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

type KeyInLayoutLocator = {
  rowIdx: number;
  colIdx: number;
  flatIdx: number;
};

export function keyInLayoutLocator(browserKeyName: string): KeyInLayoutLocator {
  let rowIdx = -1;
  let colIdx = -1;
  let flatIdx = 0;

  keyboardLayout.forEach((row, rowProbeIdx) => {
    row.forEach((key, colProbeIdx) => {
      if (key.browserKeyName === browserKeyName) {
        if (rowIdx !== -1) {
          throw new Error(`key "${browserKeyName}" duplicated`);
        }
        rowIdx = rowProbeIdx;
        colIdx = colProbeIdx;
      }
      if (rowIdx === -1) {
        flatIdx += 1;
      }
    });
  });

  if (rowIdx === -1) {
    throw new Error(`key "${browserKeyName}" not found`);
  }

  return { rowIdx, colIdx, flatIdx };
}

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
