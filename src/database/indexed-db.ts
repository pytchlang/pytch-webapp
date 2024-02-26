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
import { delaySeconds, failIfNull, hexSHA256, PYTCH_CYPRESS } from "../utils";
import { PytchProgram, PytchProgramOps } from "../model/pytch-program";
import { AddAssetDescriptorOps } from "../storage/zipfile";
import {
  SpecimenContentHash,
  LinkedContentRef,
  LinkedContentRefNone,
  eqLinkedContentRefs,
  LinkedContentRefUpdate,
} from "../model/linked-content-core";

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

// TODO: Unify linkedContentRef and trackedTutorialRef?  They're both
// talking about "where this project came from".  For trackedTutorialRef
// would need to add extra context like "what chapter?".  Might fit with
// specimen in terms of "which task is the user working on?".

// Quite a lot of overlap between this and the ProjectSummaryRecord
// type.  Can this be fixed?
export type CreateProjectOptions = Partial<{
  program: PytchProgram;
  summary: string | null;
  trackedTutorialRef: ITrackedTutorialRef | null;
  linkedContentRef: LinkedContentRef;
  assets: Array<AddAssetDescriptor>;
}>;

const _defaultNewProjectProgram =
  PytchProgramOps.fromPythonCode("import pytch\n\n");

const _defaultCreateProjectOptions: Required<CreateProjectOptions> = {
  program: _defaultNewProjectProgram,
  summary: null,
  trackedTutorialRef: null,
  linkedContentRef: LinkedContentRefNone,
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

// The `sortKey` is only used for "per-method" projects (i.e., PytchJr),
// but it does no harm for "flat" projects.
interface ProjectAssetRecord {
  id?: number; // Optional because auto-incremented
  projectId: ProjectId;
  sortKey: number; // New in v6
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

/** V6 adds field "sortKey" to the projectAssets table. */
async function dbUpgrade_V6_from_V5(txn: Transaction) {
  // Before V6 there were no guarantees about ordering of assets within
  // a project.  Order by record-ID as a reasonable starting point.
  const nModified = await txn
    .table("projectAssets")
    .toCollection()
    .modify((projectAsset) => {
      projectAsset.sortKey = projectAsset.id;
    });

  console.log(`upgraded ${nModified} records to DBv6`);
}

type KeyedSyncTask = {
  key: string;
  action: () => Promise<void>;
  onRetired: () => void;
};

export class DexieStorage extends Dexie {
  projectSummaries: Dexie.Table<ProjectSummaryRecord, number>;
  projectPytchPrograms: Dexie.Table<ProjectPytchProgramRecord, number>;
  projectAssets: Dexie.Table<ProjectAssetRecord, number>;
  assets: Dexie.Table<AssetRecord, AssetId>;

  queuedSyncTasks: Array<KeyedSyncTask>;
  processingQueuedSyncTasks: boolean;

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

    // No changes to tables or indexes, so no need for stores() calls.
    this.version(4).upgrade(dbUpgrade_V4_from_V3);
    this.version(5).upgrade(dbUpgrade_V5_from_V4);
    this.version(6).upgrade(dbUpgrade_V6_from_V5);

    this.projectSummaries = this.table("projectSummaries");
    this.projectPytchPrograms = this.table("projectPytchPrograms");
    this.projectAssets = this.table("projectAssets");
    this.assets = this.table("assets");

    this.queuedSyncTasks = [];
    this.processingQueuedSyncTasks = false;
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
      linkedContentRef: completeOptions.linkedContentRef,
      summary: completeOptions.summary ?? undefined,
      trackedTutorialRef: completeOptions.trackedTutorialRef ?? undefined,
    };

    const projectId = await this.projectSummaries.add(protoSummary);

    const program = completeOptions.program;
    await this.projectPytchPrograms.add({ projectId, program });

    // TODO: Check what's going on with trackedTutorialRef vs
    // trackedTutorial.  The types are unhelpful here.
    const project: IProjectSummary = {
      id: projectId,
      ...protoSummary,
      programKind: program.kind,
    };

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
      const sourceSummary = await this.projectSummaryRecordOrFail(sourceId);
      const programRecord = failIfNull(
        await this.projectPytchPrograms.get(sourceId),
        `could not find program for project-id ${sourceId}`
      );
      const sourceProjectAssets = await this._assetsOfProject(sourceId);

      // Deliberately do not copy the linkedContent property.  Making a
      // copy does the job of "detaching" the project from its linked
      // content.
      //
      // TODO: Should we also NOT copy the trackedTutorialRef?
      //
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
          sortKey: asset.sortKey,
          name: asset.name,
          mimeType: asset.mimeType,
          assetId: asset.assetId,
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
    let summary = await this.projectSummaryRecordOrFail(update.projectId);
    if (summary.trackedTutorialRef == null) {
      throw Error(`project ${update.projectId} is not tracking a tutorial`);
    }
    summary.trackedTutorialRef.activeChapterIndex = update.chapterIndex;
    await this.projectSummaries.put(summary);
    await this._updateProjectMtime(update.projectId);
  }

  async updateLinkedContentRef(update: LinkedContentRefUpdate): Promise<void> {
    let summary = await this.projectSummaryRecordOrFail(update.projectId);

    // TODO: Should we tighten this to just being able to update the
    // interaction-state of the linked-content reference?
    summary.linkedContentRef = update.contentRef;
    await this.projectSummaries.put(summary);
    await this._updateProjectMtime(update.projectId);
  }

  async projectSummaryFromRecord(
    summaryRecord: ProjectSummaryRecord
  ): Promise<IProjectSummary> {
    const projectId = failIfNull(
      summaryRecord.id,
      "id is null in summaryRecord"
    );
    const programRecord = failIfNull(
      await this.projectPytchPrograms.get(projectId),
      `could not find program for project-id ${projectId}`
    );
    return {
      id: projectId,
      name: summaryRecord.name,
      programKind: programRecord.program.kind,
      mtime: summaryRecord.mtime,
      linkedContentRef: summaryRecord.linkedContentRef,
      summary: summaryRecord.summary,
    };
  }

  async projectSummaryRecordOrFail(
    projectId: ProjectId
  ): Promise<ProjectSummaryRecord> {
    return failIfNull(
      await this.projectSummaries.get(projectId),
      `could not find project-summary for ${projectId}`
    );
  }

  async projectSummary(id: number): Promise<IProjectSummary> {
    await this.queuedSyncTasksQueueEmpty();
    const summary = await this.projectSummaryRecordOrFail(id);
    return await this.projectSummaryFromRecord(summary);
  }

  async allProjectSummaries(): Promise<Array<IProjectSummary>> {
    await this.queuedSyncTasksQueueEmpty();
    let summaries = await this.projectSummaries.toArray();
    summaries.sort(ProjectSummaryRecord_compareMtimeDesc);
    return await Promise.all(
      summaries.map((summary) => this.projectSummaryFromRecord(summary))
    );
  }

  /** Return (a promise resolving to) an array of `IProjectSummary`s,
   * containing all projects linked to the content referred to by
   * `linkedContentRef`.  The most-recently-modified project is first in
   * the returned array. */
  async projectSummariesWithLink(
    linkedContentRef: LinkedContentRef
  ): Promise<Array<IProjectSummary>> {
    let summaries = await this.projectSummaries
      .filter((summary) =>
        eqLinkedContentRefs(summary.linkedContentRef, linkedContentRef)
      )
      .toArray();
    summaries.sort(ProjectSummaryRecord_compareMtimeDesc);
    return await Promise.all(
      summaries.map((summary) => this.projectSummaryFromRecord(summary))
    );
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
      linkedContentRef: summary.linkedContentRef,
      trackedTutorial: maybeTrackedTutorial,
    };

    return descriptor;
  }

  async _assetsOfProject(id: ProjectId): Promise<Array<ProjectAssetRecord>> {
    return await this.projectAssets
      .where("projectId")
      .equals(id)
      .sortBy("sortKey");
  }

  async assetsInProject(id: ProjectId): Promise<Array<IAssetInProject>> {
    const assetRecords = await this._assetsOfProject(id);

    return assetRecords.map((r) => ({
      name: r.name,
      mimeType: r.mimeType,
      id: r.assetId,
      transform: r.transform ?? AssetTransformOps.newNoop(r.mimeType),
    }));
  }

  async _maxAssetSortKeyInProject(id: ProjectId): Promise<number> {
    const assetRecords = await this._assetsOfProject(id);
    const nAssets = assetRecords.length;
    return nAssets === 0 ? 0 : assetRecords[nAssets - 1].sortKey;
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

      await this.transaction("rw", this.projectAssets, async () => {
        const maxKey = await this._maxAssetSortKeyInProject(projectId);
        const sortKey = maxKey + 1;
        await this.projectAssets.put({
          projectId,
          sortKey,
          name,
          mimeType,
          assetId,
          transform,
        });
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

  async reorderAssetsInProject(
    projectId: ProjectId,
    movingName: string,
    targetName: string,
    isInNameGroup: (name: string) => boolean
  ): Promise<void> {
    if (!isInNameGroup(movingName))
      throw new Error(`${movingName} is not within name-group`);
    if (!isInNameGroup(targetName))
      throw new Error(`${targetName} is not within name-group`);

    this.transaction("rw", this.projectAssets, async () => {
      const allAssets = await this._assetsOfProject(projectId);
      const assetsInGroup = allAssets.filter((a) => isInNameGroup(a.name));

      const movingIdx = assetsInGroup.findIndex((a) => a.name === movingName);
      if (movingIdx === -1)
        throw new Error(`project ${projectId} has no asset "${movingName}"`);

      const targetIdx = assetsInGroup.findIndex((a) => a.name === targetName);
      if (targetIdx === -1)
        throw new Error(`project ${projectId} has no asset "${targetName}"`);

      if (movingIdx === targetIdx)
        // Perhaps an application-level error, but treat as no-op.
        return;

      const reorderedAssets: Array<ProjectAssetRecord> = (() => {
        const movingElt = assetsInGroup[movingIdx];
        if (movingIdx < targetIdx) {
          const head0 = assetsInGroup.slice(0, movingIdx);
          const head1 = assetsInGroup.slice(movingIdx + 1, targetIdx + 1);
          const tail = assetsInGroup.slice(targetIdx + 1);
          return [...head0, ...head1, movingElt, ...tail];
        } else {
          const head = assetsInGroup.slice(0, targetIdx);
          const tail0 = assetsInGroup.slice(targetIdx, movingIdx);
          const tail1 = assetsInGroup.slice(movingIdx + 1);
          return [...head, movingElt, ...tail0, ...tail1];
        }
      })();

      reorderedAssets.forEach((a, idx) => {
        a.sortKey = idx;
      });

      await this.projectAssets.bulkPut(reorderedAssets);
    });
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
        let summary = await this.projectSummaryRecordOrFail(projectId);
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

  enqueueSyncTask(task: KeyedSyncTask) {
    let oldIndex = this.queuedSyncTasks.findIndex(
      (existingTask) => existingTask.key === task.key
    );
    if (oldIndex !== -1) {
      const [oldTask] = this.queuedSyncTasks.splice(oldIndex, 1, task);
      oldTask.onRetired();
    } else {
      this.queuedSyncTasks.push(task);
    }

    // Ensure running but do not await:
    this.processQueuedSyncTasks();
  }

  async queuedSyncTasksQueueEmpty() {
    // TODO: Is there a better way than polling?
    while (this.queuedSyncTasks.length > 0 || this.processingQueuedSyncTasks) {
      await delaySeconds(0.25);
    }
  }

  async processQueuedSyncTasks() {
    if (this.processingQueuedSyncTasks) return;
    this.processingQueuedSyncTasks = true;

    while (this.queuedSyncTasks.length > 0) {
      const [task] = this.queuedSyncTasks.splice(0, 1);
      await task.action();

      // Allow testing under conditions which might lead to races.  This
      // is not at all perfect but might help catch some races which we
      // wouldn't otherwise have caught.
      const mDelay = PYTCH_CYPRESS()["QUEUED_SYNC_TASK_DELAY"] ?? 0.0;
      if (mDelay > 0.0) await delaySeconds(mDelay, true);

      task.onRetired();
    }

    this.processingQueuedSyncTasks = false;
  }
}

const _db = new DexieStorage();
PYTCH_CYPRESS()["PYTCH_DB"] = _db;

export const projectSummary = _db.projectSummary.bind(_db);
export const allProjectSummaries = _db.allProjectSummaries.bind(_db);
export const projectSummariesWithLink = _db.projectSummariesWithLink.bind(_db);
export const projectContentHash = _db.projectContentHash.bind(_db);
export const createNewProject = _db.createNewProject.bind(_db);
export const copyProject = _db.copyProject.bind(_db);
export const updateTutorialChapter = _db.updateTutorialChapter.bind(_db);
export const updateLinkedContentRef = _db.updateLinkedContentRef.bind(_db);
export const projectDescriptor = _db.projectDescriptor.bind(_db);
export const assetsInProject = _db.assetsInProject.bind(_db);
export const addAssetToProject = _db.addAssetToProject.bind(_db);
export const addRemoteAssetToProject = _db.addRemoteAssetToProject.bind(_db);
export const deleteAssetFromProject = _db.deleteAssetFromProject.bind(_db);
export const reorderAssetsInProject = _db.reorderAssetsInProject.bind(_db);
export const renameAssetInProject = _db.renameAssetInProject.bind(_db);
export const updateProject = _db.updateProject.bind(_db);
export const assetData = _db.assetData.bind(_db);
export const deleteManyProjects = _db.deleteManyProjects.bind(_db);
export const renameProject = _db.renameProject.bind(_db);
export const updateAssetTransform = _db.updateAssetTransform.bind(_db);
export const enqueueSyncTask = _db.enqueueSyncTask.bind(_db);
