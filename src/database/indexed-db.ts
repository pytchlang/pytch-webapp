import Dexie from "dexie";
import { IProjectSummary, ProjectId } from "../model/projects";
import { IProjectContent } from "../model/project";
import { IAssetInProject, AssetId } from "../model/asset";

const _octetStringOfU8: Array<string> = (() => {
    const strings = [];
    for (let i = 0; i <= 0xff; ++i)
      strings.push(i.toString(16).padStart(2, "0"));
    return strings;
})();

const _hexOfBuffer = (data: ArrayBuffer): string => {
    const u8s = new Uint8Array(data);
    const octetStrings = new Array(u8s.length);
    for (let i = 0; i !== u8s.length; ++i)
        octetStrings[i] = _octetStringOfU8[u8s[i]];
    return octetStrings.join("");
}

const _idOfAssetData = async (data: ArrayBuffer): Promise<string> => {
    const hash = await window.crypto.subtle.digest({name: "SHA-256"}, data);
    return _hexOfBuffer(hash);
}

interface ProjectSummaryRecord {
    id?: ProjectId,  // Optional because auto-incremented
    name: string,
    summary?: string,
}

interface ProjectCodeTextRecord {
    id?: ProjectId,  // Optional because auto-incremented
    codeText: string,
}

interface ProjectAssetRecord {
    id?: number,  // Optional because auto-incremented
    projectId: ProjectId,
    name: string,
    mimeType: string,
    assetId: AssetId,
}

interface AssetRecord {
    id: AssetId,
    data: ArrayBuffer,
}

export class DexieStorage extends Dexie {
    projectSummaries: Dexie.Table<ProjectSummaryRecord, number>;
    projectCodeTexts: Dexie.Table<ProjectCodeTextRecord, number>;
    projectAssets: Dexie.Table<ProjectAssetRecord, number>;
    assets: Dexie.Table<AssetRecord, AssetId>;

    constructor() {
        super("pytch");

        this.version(1).stores({
            projectSummaries: "++id",  // name, summary
            projectCodeTexts: "id",  // codeText
            projectAssets: "++id, projectId",  // name, mimeType, assetId
            assets: "id",  // data
        });

        this.projectSummaries = this.table("projectSummaries");
        this.projectCodeTexts = this.table("projectCodeTexts");
        this.projectAssets = this.table("projectAssets");
        this.assets = this.table("assets");
    }

    async createNewProject(name: string): Promise<IProjectSummary> {
    }

    async allProjectSummaries(): Promise<Array<IProjectSummary>> {
    }

    async projectContent(id: ProjectId): Promise<IProjectContent> {
    }

    async _storeAsset(assetData: ArrayBuffer): Promise<string> {
    }

    async addAssetToProject(
        projectId: ProjectId,
        name: string,
        mimeType: string,
        data: ArrayBuffer
    ): Promise<IAssetInProject> {
    }

    async updateCodeTextOfProject(projectId: ProjectId, codeText: string) {
    }

    async assetData(assetId: AssetId): Promise<ArrayBuffer> {
    }
}