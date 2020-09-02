import Dexie from "dexie";

export class DexieStorage {
    db: Dexie;

    constructor() {
        this.db = new Dexie("pytch");

        this.db.version(1).stores({
            projectSummaries: "++id",  // name, summary
            projectCodeTexts: "++id",  // codeText
            projectAssets: "++id, projectId",  // name, mimeType, assetId
            assets: "id",  // data
        });
    }
}