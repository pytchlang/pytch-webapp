import { IProjectSummary, ProjectId } from "../model/projects";
import { IProjectContent } from "../model/project";
import { AssetId } from "../model/asset";

const dummyProjectSummaries: Array<IProjectSummary> = [
  {id: 1001, name: "Bash the zombies", summary: "Run round splatting zombies."},
  {id: 1002, name: "Bike game"},
  {id: 1003, name: "Brag" },
  {id: 1004, name: "Pick your nose", summary: "Are you hungry?" },
  {id: 1005, name: "Round the world", summary: "Can you beat everyone?" },
  {id: 1006, name: "Bop-it", summary: "Bop it!  Twist it!  Pull it!" },
  {id: 1007, name: "Space invaders" },
  {id: 1008, name: "Pacperson" },
];

type ProjectSummaryById = Map<ProjectId, IProjectSummary>;

let projectSummaries: ProjectSummaryById = (() => {
    let summaries: ProjectSummaryById = new Map<ProjectId, IProjectSummary>();
    dummyProjectSummaries.forEach((p) => {
        summaries.set(p.id, p);
    });
    return summaries;
})();

type ProjectContentById = Map<ProjectId, IProjectContent>;

const initialProjectContent = (summary: IProjectSummary): IProjectContent => {
  return {
    id: summary.id,
    codeText: `# This is project ${summary.name}\n`,
    assets: [{name: "banana.png", mimeType: "image/png", id: "a1"},
             {name: "fanfare.mp3", mimeType: "audio/mpeg", id: "a2"}],
  };
};

let projectContents: ProjectContentById = (() => {
    let projects: ProjectContentById = new Map<ProjectId, IProjectContent>();
    projectSummaries.forEach((p, id) => {
        projects.set(p.id, initialProjectContent(p));
    });
    return projects;
})();

let nextId = 1009;  // To match last dummy project having "1008"

export const createNewProject = async (name: string): Promise<IProjectSummary> => {
  let id = nextId;
  nextId += 1;
  let project = {id, name};
  projectSummaries.set(id, project);
  projectContents.set(id, initialProjectContent(project));
  return project;
};

const delay = (ms: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  })
}

export const loadAllSummaries = async (): Promise<Array<IProjectSummary>> => {
  console.log("db.loadAllSummaries(): entering");
  await delay(500);
  console.log("db.loadAllSummaries(): about to return");
  return Array.from(projectSummaries.values());
}

const getContent = async (id: ProjectId): Promise<IProjectContent> => {
  const maybeContent = projectContents.get(id);
  if (typeof maybeContent === "undefined")
      throw Error(`could not find content for ${id}`);
  return maybeContent as IProjectContent;
}

export const loadContent = async (id: ProjectId): Promise<IProjectContent> => {
    console.log("loadContent(): entering for", id);
    await delay(500);
    const content = await getContent(id);
    const contentCopy = {
      id: content.id,
      codeText: content.codeText,
      assets: content.assets.slice(),
    };
    console.log("loadContent(): returning for", id);
    return contentCopy;
}

// TODO: Move this stuff to its own file?
//
type AssetDataById = Map<AssetId, ArrayBuffer>;

const assetDataById: AssetDataById = new Map<AssetId, ArrayBuffer>();

export interface AssetDataServer {
  fetch(assetId: string): Promise<ArrayBuffer>;
}

class MemoryAssetDataServer implements AssetDataServer {
  async fetch(assetId: string) {
    const maybeData = assetDataById.get(assetId);
    if (maybeData == null) {
      throw Error(`could not find asset ${assetId}`);
    }
    return maybeData;
  }
}

export const assetDataServer = new MemoryAssetDataServer();

const octetString = (() => {
  const strings = [];
  for (let i = 0; i <= 0xff; ++i)
    strings.push(i.toString(16).padStart(2, "0"));
  return strings;
})();

const hexOfBuffer = (data: ArrayBuffer): string => {
  const u8s = new Uint8Array(data);
  const octetStrings = new Array(u8s.length);
  for (let i = 0; i !== u8s.length; ++i)
    octetStrings[i] = octetString[u8s[i]];
  return octetStrings.join("");
}

const idOfAsset = async (assetData: ArrayBuffer): Promise<string> => {
  const hash = await window.crypto.subtle.digest({name: "SHA-256"}, assetData);
  return hexOfBuffer(hash);
}

export const storeAsset = async (assetData: ArrayBuffer) => {
  const id = await idOfAsset(assetData);
  console.log(`storeAsset(): id ${id}`);
  assetDataById.set(id, assetData);
  return id;
}

export const addAssetToProject = async (
  projectId: ProjectId,
  name: string,
  mimeType: string,
  data: ArrayBuffer,
) => {
  const assetId = await storeAsset(data);
  console.log(`addAssetToProject(): assetId ${assetId}`);
  let content = await getContent(projectId);
  const assetInProject = {name, mimeType, id: assetId};
  content.assets.push(assetInProject);
  return assetInProject;
}

export const updateCodeTextOfProject = async (
  projectId: ProjectId,
  newText: string,
) => {
  let content = await getContent(projectId);
  content.codeText = newText;
  await delay(750);
}
