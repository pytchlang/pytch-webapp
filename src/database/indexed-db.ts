import Dexie from "dexie";
import { IProjectSummary, ProjectId } from "../model/projects";
import { IProjectContent } from "../model/project";

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