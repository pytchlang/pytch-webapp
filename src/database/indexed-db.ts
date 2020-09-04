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

    async createNewProject(name: string, summary?: string): Promise<IProjectSummary> {
        const protoSummary = { name, summary };
        const id = await this.projectSummaries.add(protoSummary);
        await this.projectCodeTexts.add({
            id,
            codeText: `# Code for "${name}"`,
        });
        return { id, ...protoSummary };
    }

    async allProjectSummaries(): Promise<Array<IProjectSummary>> {
        const summaries = await this.projectSummaries.toArray();
        return summaries.map(sr => {
            if (sr.id == null) {
                throw Error("got null ID in projectSummaries table");
            }
            return {
                id: sr.id,
                name: sr.name,
                summary: sr.summary,
            };
        });
    }

    async projectContent(id: ProjectId): Promise<IProjectContent> {
        const [ codeRecord, assetRecords ] = await Promise.all([
            this.projectCodeTexts.get(id),
            this.projectAssets.where("projectId").equals(id).toArray(),
        ]);
        if (codeRecord == null) {
            throw Error(`could not find code for project "${id}"`);
        }
        if (assetRecords == null) {
            throw Error(`got null assetRecords for project id "${id}"`);
        }
        const content = {
            id,
            codeText: codeRecord.codeText,
            assets: assetRecords.map(r => ({
                name: r.name,
                mimeType: r.mimeType,
                id: r.assetId,
            })),
        };
        return content;
    }

    async _storeAsset(assetData: ArrayBuffer): Promise<string> {
        const id = await _idOfAssetData(assetData);
        await this.assets.add({id, data: assetData});
        return id;
    }

    async addAssetToProject(
        projectId: ProjectId,
        name: string,
        mimeType: string,
        data: ArrayBuffer
    ): Promise<IAssetInProject> {
        const assetId = await this._storeAsset(data);
        await this.projectAssets.put({
            projectId,
            name,
            mimeType,
            assetId,
        });
        return { name, mimeType, id: assetId };
    }

    async updateCodeTextOfProject(projectId: ProjectId, codeText: string) {
        await this.projectCodeTexts.put({ id: projectId, codeText });
    }

    async assetData(assetId: AssetId): Promise<ArrayBuffer> {
        const assetRecord = await this.assets.get({id: assetId});
        if (assetRecord == null) {
            throw Error(`could not find asset with id "${assetId}"`);
        }
        return assetRecord.data;
    }
}

const _dexieStorage = new DexieStorage();

export const loadAllSummaries = _dexieStorage.allProjectSummaries.bind(_dexieStorage);
export const createNewProject = _dexieStorage.createNewProject.bind(_dexieStorage);
export const loadContent = _dexieStorage.projectContent.bind(_dexieStorage);
export const addAssetToProject = _dexieStorage.addAssetToProject.bind(_dexieStorage);
export const updateCodeTextOfProject = _dexieStorage.updateCodeTextOfProject.bind(_dexieStorage);
export const assetData = _dexieStorage.assetData.bind(_dexieStorage);
