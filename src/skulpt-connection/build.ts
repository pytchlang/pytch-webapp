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
