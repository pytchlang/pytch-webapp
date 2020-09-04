import { IProjectContent } from "../model/project";
import { assetServer } from "./asset-server";
import { ensureSoundManager } from "./sound-manager";

declare var Sk: any;

const builtinRead = (fileName: string) => {
    if (
        Sk.builtinFiles === undefined ||
        Sk.builtinFiles["files"][fileName] === undefined
    ) {
        throw Error(`File not found: '${fileName}'`);
    }

    return Sk.builtinFiles["files"][fileName];
};

enum BuildOutcomeKind {
    Success,
    Failure,
}

interface BuildSuccess {
    kind: BuildOutcomeKind.Success;
}

interface BuildFailure {
    kind: BuildOutcomeKind.Failure;
    error: any;  // TODO: Can we do better here?
}

type BuildOutcome = BuildSuccess | BuildFailure;

export const build = async (
    project: IProjectContent,
    addOutputChunk: (chunk: string) => void,
): Promise<BuildOutcome> => {
    Sk.configure({
        read: builtinRead,
        output: addOutputChunk,
    });
    try {
        assetServer.prefetch(project.assets);
        ensureSoundManager();
        Sk.pytch.async_load_image = (name: string) => {
            // TODO: Get rid of the bit which puts "project-assets/" in there
            // in the first place.
            const nameParts = name.split("/");
            const basename = nameParts[nameParts.length - 1];
            return assetServer.loadImage(basename);
        };
        await Sk.pytchsupport.import_with_auto_configure(project.codeText);
        return { kind: BuildOutcomeKind.Success };
    } catch (err) {
        return { kind: BuildOutcomeKind.Failure, error: err };
    }
}
