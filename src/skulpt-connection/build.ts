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
