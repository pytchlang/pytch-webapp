import { StoredProjectContent } from "../model/project";
import { PytchProgramOps } from "../model/pytch-program";
import { assetServer } from "./asset-server";
import { ensureSoundManager } from "./sound-manager";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let Sk: any;

const builtinRead = (fileName: string) => {
  if (
    Sk.builtinFiles === undefined ||
    Sk.builtinFiles["files"][fileName] === undefined
  ) {
    throw Error(`File not found: '${fileName}'`);
  }

  return Sk.builtinFiles["files"][fileName];
};

export enum BuildOutcomeKind {
  Success,
  Failure,
}

interface BuildSuccess {
  kind: BuildOutcomeKind.Success;
}

interface BuildFailure {
  kind: BuildOutcomeKind.Failure;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any; // TODO: Can we do better here?
}

export type BuildOutcome = BuildSuccess | BuildFailure;

export const build = async (
  project: StoredProjectContent,
  addOutputChunk: (chunk: string) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleError: (pytchError: any, errorContext: any) => void
): Promise<BuildOutcome> => {
  // This also resets the current_live_project slot.
  Sk.configure({
    __future__: Sk.python3,
    read: builtinRead,
    output: addOutputChunk,
    pytch: { on_exception: handleError },
  });
  try {
    ensureSoundManager();
    Sk.pytch.async_load_image = (name: string) => assetServer.loadImage(name);

    const flattenedProgram = PytchProgramOps.flatCodeText(
      project.program,
      project.assets
    );
    const codeText = flattenedProgram.code;
    await Sk.pytchsupport.import_with_auto_configure(codeText);
    Sk.pytch.current_live_project.on_green_flag_clicked();
    return { kind: BuildOutcomeKind.Success };
  } catch (err) {
    return { kind: BuildOutcomeKind.Failure, error: err };
  }
};
