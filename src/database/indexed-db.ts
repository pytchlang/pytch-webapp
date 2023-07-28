import Dexie, { Transaction } from "dexie";

import { tutorialContent } from "./tutorials";

import { ProjectId, ITrackedTutorial } from "../model/project-core";
import {
  IProjectSummary,
  ITutorialTrackingUpdate,
  ITrackedTutorialRef,
} from "../model/projects";
import { StoredProjectDescriptor } from "../model/project";
import {
  IAssetInProject,
  AssetId,
  AssetPresentation,
  AssetTransform,
  AssetTransformOps,
} from "../model/asset";
import { failIfNull, hexSHA256, PYTCH_CYPRESS } from "../utils";
import { PytchProgram, PytchProgramOps } from "../model/pytch-program";
import { AddAssetDescriptorOps } from "../storage/zipfile";
import {
  SpecimenContentHash,
} from "../model/linked-content";

class PytchDuplicateAssetNameError extends Error {
  constructor(
    message: string,
    readonly projectId: ProjectId,
    readonly assetName: string
  ) {
    super(message);
    this.name = "PytchDuplicateAssetNameError";
  }

  get jsonDetails() {
    return JSON.stringify({
      name: this.name,
      message: this.message,
      projectId: this.projectId,
      assetName: this.assetName,
    });
  }
}

const _basenameOfUrl = (url: string): string => {
  const parts = url.split("/");
  return parts[parts.length - 1];
};

// Quite a lot of overlap between this and the ProjectSummaryRecord
// type.  Can this be fixed?
export type CreateProjectOptions = Partial<{
  program: PytchProgram;
  summary: string | null;
  trackedTutorialRef: ITrackedTutorialRef | null;
  assets: Array<AddAssetDescriptor>;
}>;

const _defaultNewProjectProgram =
  PytchProgramOps.fromPythonCode("import pytch\n\n");

const _defaultCreateProjectOptions: Required<CreateProjectOptions> = {
  program: _defaultNewProjectProgram,
  summary: null,
  trackedTutorialRef: null,
  assets: [],
};

// TODO: Is there a good way to avoid repeating this information here vs
// in the IProjectSummary definition?
interface ProjectSummaryRecord {
  id?: ProjectId; // Optional because auto-incremented
  name: string;
  mtime: number; // New in V4
  linkedContentRef: LinkedContentRef; // New in V5
  summary?: string;
  trackedTutorialRef?: ITrackedTutorialRef;
}

/** Sort `ProjectSummaryRecord` instances in descending order of mtime,
 i.e., such that most recently modified instances come first.  For
 end-to-end tests, where we create multiple projects at once without UI
 interaction and so sometimes within the same millisecond, break ties by
 sorting projects with larger IDs (which were created more recently)
 before projects with smaller IDs. */
function ProjectSummaryRecord_compareMtimeDesc(
  a: ProjectSummaryRecord,
  b: ProjectSummaryRecord
) {
  const mtimeDiff = b.mtime - a.mtime;
  if (mtimeDiff !== 0) return mtimeDiff;

  // Any projects we compare really should have ids, but treat id-less
  // projects as if they had an id of -1.
  return (b.id ?? -1) - (a.id ?? -1);
}

// Need to keep this around for use in the upgrade function:
interface ProjectCodeTextRecord {
  id?: ProjectId; // Optional because auto-incremented
  codeText: string;
}

interface ProjectPytchProgramRecord {
  projectId: ProjectId;
  program: PytchProgram;
}

interface ProjectAssetRecord {
  id?: number; // Optional because auto-incremented
  projectId: ProjectId;
  name: string;
  mimeType: string;
  assetId: AssetId;
  transform?: AssetTransform;
}

interface AssetRecord {
  id: AssetId;
  data: ArrayBuffer;
}

export interface AddAssetDescriptor {
  name: string;
  mimeType: string;
  data: ArrayBuffer;
  transform?: AssetTransform;
}

async function dbUpgrade_V3_from_V2(txn: Transaction) {
  console.log("upgrading to DBv3");

  // In fact the "id" property is always present; the above comment
  // saying it's auto-incremented is in error.
  const codeRecords: Array<Required<ProjectCodeTextRecord>> = await txn
    .table("projectCodeTexts")
    .toArray();

  const nRecords = codeRecords.length;

  const programRecords: Array<ProjectPytchProgramRecord> = codeRecords.map(
    (cr) => ({
      projectId: cr.id,
      program: PytchProgramOps.fromPythonCode(cr.codeText),
    })
  );

  await txn.table("projectPytchPrograms").bulkPut(programRecords);

  console.log(`upgraded ${nRecords} records to DBv3`);
}

/** V4 adds field "mtime" to the projectSummaries table. */
async function dbUpgrade_V4_from_V3(txn: Transaction) {
  console.log("upgrading to DBv4");

  const mtime = Date.now();
  await txn.table("projectSummaries").toCollection().modify({ mtime });

  const nRecords = await txn.table("projectSummaries").count();
  console.log(`upgraded ${nRecords} records to DBv4`);
}

/** V5 adds field "linkedContentRef" to the projectSummaries table. */
async function dbUpgrade_V5_from_V4(txn: Transaction) {
  console.log("upgrading to DBv5");

  const linkedContentRef = LinkedContentRefNone;
  await txn
    .table("projectSummaries")
    .toCollection()
    .modify({ linkedContentRef });

  const nRecords = await txn.table("projectSummaries").count();
  console.log(`upgraded ${nRecords} records to DBv5`);
}

function projectSummaryFromRecord(
  summaryRecord: ProjectSummaryRecord
): IProjectSummary {
  return {
    id: failIfNull(summaryRecord.id, "id is null in summaryRecord"),
    name: summaryRecord.name,
    mtime: summaryRecord.mtime,
    summary: summaryRecord.summary,
  };
}

export class DexieStorage extends Dexie {
  projectSummaries: Dexie.Table<ProjectSummaryRecord, number>;
  projectPytchPrograms: Dexie.Table<ProjectPytchProgramRecord, number>;
  projectAssets: Dexie.Table<ProjectAssetRecord, number>;
  assets: Dexie.Table<AssetRecord, AssetId>;

  constructor() {
    super("pytch");

    this.version(2).stores({
      projectSummaries: "++id", // name, summary, trackedTutorialRef
      projectCodeTexts: "id", // codeText
      projectAssets: "++id, projectId, &[projectId+name]", // name, mimeType, assetId
      assets: "id", // data
    });

    this.version(3)
      .stores({
        projectCodeTexts: null, // Delete this table
        projectPytchPrograms: "projectId", // program
      })
      .upgrade(dbUpgrade_V3_from_V2);

    // No change to tables or indexes, so no need for stores() call.
    this.version(4).upgrade(dbUpgrade_V4_from_V3);

    this.projectSummaries = this.table("projectSummaries");
    this.projectPytchPrograms = this.table("projectPytchPrograms");
    this.projectAssets = this.table("projectAssets");
    this.assets = this.table("assets");
  }

  // We won't expose this as a bound method below yet.  For now it's
  // just to allow tests to seed the database to a known state.
  //
  async dangerDangerDeleteEverything() {
    await this.projectSummaries.clear();
    await this.projectPytchPrograms.clear();
    await this.projectAssets.clear();
    await this.assets.clear();
  }

  async projectContentHash(id: ProjectId): Promise<SpecimenContentHash> {
    const p = failIfNull(
      await this.projectPytchPrograms.get(id),
      `could not find project-program with project-id ${id}`
    );

    const programFingerprint = await PytchProgramOps.fingerprint(p.program);

    const projectAssets = await this.assetsInProject(id);
    const addAssetDescriptors = await Promise.all(
      projectAssets.map(async (a) => ({
        name: a.name,
        mimeType: a.mimeType,
        data: await this.assetData(a.id),
        transform: a.transform,
      }))
    );

    const assetsFingerprint = await AddAssetDescriptorOps.fingerprintArray(
      addAssetDescriptors
    );

    const fullFingerprintContent = `${programFingerprint}\n${assetsFingerprint}\n`;

    const contentHash = await hexSHA256(fullFingerprintContent);
    return contentHash;
  }

  async createNewProject(
    name: string,
    options: CreateProjectOptions
  ): Promise<IProjectSummary> {
    const completeOptions: Required<CreateProjectOptions> = {
      ..._defaultCreateProjectOptions,
      ...options,
    };

    // Convert null to undefined for the properties which are optional
    // in the database:
    const protoSummary: Omit<ProjectSummaryRecord, "id"> = {
      name,
      mtime: Date.now(),
      summary: completeOptions.summary ?? undefined,
      trackedTutorialRef: completeOptions.trackedTutorialRef ?? undefined,
    };

    const projectId = await this.projectSummaries.add(protoSummary);

    const program = completeOptions.program;
    await this.projectPytchPrograms.add({ projectId, program });

    const project = { id: projectId, ...protoSummary };

    await Promise.all(
      completeOptions.assets.map((asset) =>
        this.addAssetToProject(
          project.id,
          asset.name,
          asset.mimeType,
          asset.data,
          asset.transform
        )
      )
    );

    return project;
  }

  async _updateProjectMtime(projectId: ProjectId) {
    const mtime = Date.now();
    const nUpdated = await this.projectSummaries.update(projectId, { mtime });
    if (nUpdated === 0)
      console.error(
        "_updateProjectMtime():" +
          ` could not find summary for project-id ${projectId}`
      );
  }

  async copyProject(
    sourceId: ProjectId,
    destinationName: string
  ): Promise<ProjectId> {
    const tables = [
      this.projectSummaries,
      this.projectPytchPrograms,
      this.projectAssets,
    ];

    return this.transaction("rw", tables, async () => {
      const sourceSummary = failIfNull(
        await this.projectSummaries.get(sourceId),
        `could not find summary for project-id ${sourceId}`
      );
      const programRecord = failIfNull(
        await this.projectPytchPrograms.get(sourceId),
        `could not find program for project-id ${sourceId}`
      );
      const sourceProjectAssets = await this.assetsInProject(sourceId);

      const creationOptions = {
        summary: sourceSummary.summary,
        trackedTutorialRef: sourceSummary.trackedTutorialRef,
        program: programRecord.program,
      };
      const newProject = await this.createNewProject(
        destinationName,
        creationOptions
      );
      const newProjectId = newProject.id;

      for (const asset of sourceProjectAssets) {
        await this.projectAssets.put({
          projectId: newProjectId,
          name: asset.name,
          mimeType: asset.mimeType,
          assetId: asset.id,
          transform: asset.transform,
        });
      }

      return newProjectId;
    });
  }

  async deleteManyProjects(ids: Array<ProjectId>): Promise<void> {
    const tables = [
      this.projectSummaries,
      this.projectPytchPrograms,
      this.projectAssets,
    ];
    await this.transaction("rw", tables, async () => {
      await this.projectSummaries.where("id").anyOf(ids).delete();
      await this.projectPytchPrograms.where("projectId").anyOf(ids).delete();
      await this.projectAssets.where("projectId").anyOf(ids).delete();
    });
  }

  async renameProject(id: ProjectId, newName: string): Promise<void> {
    await this.projectSummaries.update(id, { name: newName });
    await this._updateProjectMtime(id);
  }

  async updateTutorialChapter(update: ITutorialTrackingUpdate): Promise<void> {
    // TODO: Is there a good way to not repeat this checking logic
    // between here and the front end?
    let summary = failIfNull(
      await this.projectSummaries.get(update.projectId),
      `could not find project-summary for ${update.projectId}`
    );
    if (summary.trackedTutorialRef == null) {
      throw Error(`project ${update.projectId} is not tracking a tutorial`);
    }
    summary.trackedTutorialRef.activeChapterIndex = update.chapterIndex;
    await this.projectSummaries.put(summary);
    await this._updateProjectMtime(update.projectId);
  }

  async projectSummary(id: number): Promise<IProjectSummary> {
    const summary = failIfNull(
      await this.projectSummaries.get(id),
      `could not find project-summary for ${id}`
    );
    return projectSummaryFromRecord(summary);
  }

  async allProjectSummaries(): Promise<Array<IProjectSummary>> {
    let summaries = await this.projectSummaries.toArray();
    summaries.sort(ProjectSummaryRecord_compareMtimeDesc);
    return summaries.map(projectSummaryFromRecord);
  }

  async maybeTutorialContent(
    ref: ITrackedTutorialRef | undefined
  ): Promise<ITrackedTutorial | undefined> {
    if (ref == null) return undefined;

    const tutorial = await tutorialContent(ref.slug);
    return {
      content: tutorial,
      activeChapterIndex: ref.activeChapterIndex,
    };
  }

  async projectDescriptor(id: ProjectId): Promise<StoredProjectDescriptor> {
    const [maybeSummary, maybeProgramRecord, assets] = await Promise.all([
      this.projectSummaries.get(id),
      this.projectPytchPrograms.get(id),
      this.assetsInProject(id),
    ]);
    const summary = failIfNull(
      maybeSummary,
      `could not find project-summary for ${id}`
    );
    const programRecord = failIfNull(
      maybeProgramRecord,
      `could not find program for project "${id}"`
    );

    const maybeTrackedTutorial = await this.maybeTutorialContent(
      summary.trackedTutorialRef
    );

    const descriptor = {
      id,
      name: summary.name,
      program: programRecord.program,
      assets,
      trackedTutorial: maybeTrackedTutorial,
    };

    return descriptor;
  }

  async assetsInProject(id: ProjectId): Promise<Array<IAssetInProject>> {
    const assetRecords = await this.projectAssets
      .where("projectId")
      .equals(id)
      .toArray();

    return assetRecords.map((r) => ({
      name: r.name,
      mimeType: r.mimeType,
      id: r.assetId,
      transform: r.transform ?? AssetTransformOps.newNoop(r.mimeType),
    }));
  }

  async _storeAsset(assetData: ArrayBuffer): Promise<string> {
    const id = await hexSHA256(assetData);
    await this.assets.put({ id, data: assetData });
    return id;
  }

  async addAssetToProject(
    projectId: ProjectId,
    name: string,
    mimeType: string,
    data: ArrayBuffer,
    transform?: AssetTransform
  ): Promise<AssetPresentation> {
    const mimeTopLevelType = mimeType.split("/")[0];
    if (!["image", "audio"].includes(mimeTopLevelType)) {
      throw new Error("not a valid file type");
    }

    const assetId = await this._storeAsset(data);
    transform = transform ?? AssetTransformOps.newNoop(mimeType);

    const mimeMajorType = mimeType.split("/")[0];
    if (transform.targetType !== mimeMajorType)
      throw new Error(
        `asset is of mime-major-type "${mimeMajorType}"` +
          ` but transform is for "${transform.targetType}"`
      );

    try {
      // Attempt to create the AssetPresentation first.  This can fail
      // if the asset is corrupt.  If it does fail, we do not want to
      // add the asset to the project; that would leave the project
      // stuck with a corrupt asset.
      //
      // In case of failure, we are still left with a corrupt asset in
      // the assets table, but fixing that is part of a bigger task of
      // garbage-collecting unreferenced assets.
      //
      const assetInProject: IAssetInProject = {
        name,
        mimeType,
        id: assetId,
        transform,
      };
      const assetPresentation = await AssetPresentation.create(assetInProject);

      await this.projectAssets.put({
        projectId,
        name,
        mimeType,
        assetId,
        transform,
      });

      return assetPresentation;
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((err as any).name === Dexie.errnames.Constraint) {
        throw new PytchDuplicateAssetNameError(
          `Your project already contains an asset called "${name}".`,
          projectId,
          name
        );
      } else {
        throw err;
      }
    }
  }

  async addRemoteAssetToProject(
    projectId: ProjectId,
    url: string,
    customLocalName?: string
  ): Promise<AssetPresentation> {
    const rawResp = await fetch(url);

    const mimeType = failIfNull(
      rawResp.headers.get("Content-Type"),
      "did not get Content-Type header from remote asset fetch"
    );

    const data = await rawResp.arrayBuffer();

    const localName = customLocalName ?? _basenameOfUrl(url);

    return this.addAssetToProject(projectId, localName, mimeType, data);
  }

  async deleteAssetFromProject(
    projectId: ProjectId,
    assetName: string
  ): Promise<void> {
    const toDelete = this.projectAssets
      .where("projectId")
      .equals(projectId)
      .and((r) => r.name === assetName);

    const nMatching = await toDelete.count();
    if (nMatching !== 1) {
      throw Error(
        `expecting unique asset called "${assetName}" in project ${projectId}` +
          ` but found ${nMatching} of them; not deleting anything`
      );
    }

    await toDelete.delete();
    await this._updateProjectMtime(projectId);
  }

  async updateProject(
    projectId: ProjectId,
    program: PytchProgram,
    chapterIndex: number | undefined
  ): Promise<void> {
    const tables = [this.projectSummaries, this.projectPytchPrograms];
    await this.transaction("rw", tables, async () => {
      await this.projectPytchPrograms.put({ projectId, program });

      // TODO: Is there a good way to not repeat the checking logic
      // between here and the front end?

      if (chapterIndex != null) {
        let summary = failIfNull(
          await this.projectSummaries.get(projectId),
          `could not find project-summary for ${projectId}`
        );
        if (summary.trackedTutorialRef == null) {
          throw Error(`project ${projectId} is not tracking a tutorial`);
        }
        summary.trackedTutorialRef.activeChapterIndex = chapterIndex;

        await this.projectSummaries.put(summary);
      }

      await this._updateProjectMtime(projectId);
    });
  }

  async assetData(assetId: AssetId): Promise<ArrayBuffer> {
    const assetRecord = failIfNull(
      await this.assets.get({ id: assetId }),
      `could not find asset with id "${assetId}"`
    );
    return assetRecord.data;
  }

  async _soleAssetByName(
    projectId: ProjectId,
    assetName: string
  ): Promise<ProjectAssetRecord> {
    const matchingAssets = await this.projectAssets
      .where("projectId")
      .equals(projectId)
      .and((a) => a.name === assetName)
      .toArray();

    const nMatching = matchingAssets.length;
    if (nMatching !== 1) {
      throw Error(
        `found ${nMatching} assets in project ${projectId} called "${assetName}"`
      );
    }

    return matchingAssets[0];
  }

  async renameAssetInProject(
    projectId: ProjectId,
    oldName: string,
    newName: string
  ) {
    const oldRecord = await this._soleAssetByName(projectId, oldName);
    const newRecord: ProjectAssetRecord = {
      ...oldRecord,
      name: newName,
    };

    try {
      await this.projectAssets.put(newRecord);
      await this._updateProjectMtime(projectId);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((err as any).name === Dexie.errnames.Constraint) {
        throw new PytchDuplicateAssetNameError(
          `Cannot rename asset "${oldName}" to "${newName}" because` +
            ` the project already contains an asset called "${newName}".`,
          projectId,
          newName
        );
      } else {
        throw err;
      }
    }
  }

  async updateAssetTransform(
    projectId: ProjectId,
    assetName: string,
    newTransform: AssetTransform
  ) {
    const oldRecord = await this._soleAssetByName(projectId, assetName);
    const newRecord: ProjectAssetRecord = {
      ...oldRecord,
      transform: newTransform,
    };

    // TODO: Can this throw an error?
    await this.projectAssets.put(newRecord);
    await this._updateProjectMtime(projectId);
  }
}

const _db = new DexieStorage();
PYTCH_CYPRESS()["PYTCH_DB"] = _db;

export const projectSummary = _db.projectSummary.bind(_db);
export const allProjectSummaries = _db.allProjectSummaries.bind(_db);
export const projectContentHash = _db.projectContentHash.bind(_db);
export const createNewProject = _db.createNewProject.bind(_db);
export const copyProject = _db.copyProject.bind(_db);
export const updateTutorialChapter = _db.updateTutorialChapter.bind(_db);
export const projectDescriptor = _db.projectDescriptor.bind(_db);
export const assetsInProject = _db.assetsInProject.bind(_db);
export const addAssetToProject = _db.addAssetToProject.bind(_db);
export const addRemoteAssetToProject = _db.addRemoteAssetToProject.bind(_db);
export const deleteAssetFromProject = _db.deleteAssetFromProject.bind(_db);
export const renameAssetInProject = _db.renameAssetInProject.bind(_db);
export const updateProject = _db.updateProject.bind(_db);
export const assetData = _db.assetData.bind(_db);
export const deleteManyProjects = _db.deleteManyProjects.bind(_db);
export const renameProject = _db.renameProject.bind(_db);
export const updateAssetTransform = _db.updateAssetTransform.bind(_db);
