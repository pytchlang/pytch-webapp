// Assessment of a string as a possible name for a class.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let Sk: any;

export type NameValidity =
  | { status: "valid" }
  | { status: "invalid"; reason: string };

const invalidBecause = (reason: string): NameValidity => ({
  status: "invalid",
  reason,
});

/** Assess the validity (or otherwise) of the given `candidateName` for
 * a sprite, given that there already exist sprites names being the
 * elements of `existingNames`. */
export const nameValidity = (
  existingNames: Array<string>,
  candidateName: string
): NameValidity => {
  // This is a fudge but should do the job:
  if (candidateName === "Stage") {
    return invalidBecause('you cannot have a Sprite called "Stage"');
  }

  if (candidateName === "") {
    return invalidBecause("it is empty");
  }

  if (!Sk.token.isIdentifier(candidateName)) {
    return invalidBecause("it does not follow the rules for names");
  }

  if (existingNames.includes(candidateName)) {
    // TODO: Will this ever be used for things other than Sprites?
    return invalidBecause(`there is already a Sprite called ${candidateName}`);
  }

  try {
    const classDef = `class ${candidateName}:\n pass`;
    Sk.parse("<stdin>", classDef);
    return { status: "valid" };
  } catch {
    // TODO: Are there other reasons we might find ourselves here?
    return invalidBecause("it is a reserved name");
  }
};

/** Return the first string of the form `SpriteN` which is not present
 * in the given array of `existingNames`, where `N` counts up the
 * integers from 1. */
export const unusedSpriteName = (existingNames: Array<string>): string => {
  let name = "";
  let suffix = 1;

  do {
    name = `Sprite${suffix++}`;
  } while (existingNames.includes(name));

  return name;
};
