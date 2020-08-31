import { IProjectSummary } from "../model/projects";
import { IProjectContent } from "../model/project";
import { IAssetInProject } from "../model/asset";

const dummyProjectSummaries: Array<IProjectSummary> = [
  {id: "p1", name: "Bash the zombies", summary: "Run round splatting zombies."},
  {id: "p2", name: "Bike game"},
  {id: 'p3', name: "Brag" },
  {id: 'p4', name: "Pick your nose", summary: "Are you hungry?" },
  {id: 'p5', name: "Round the world", summary: "Can you beat everyone?" },
  {id: 'p6', name: "Bop-it", summary: "Bop it!  Twist it!  Pull it!" },
  {id: 'p7', name: "Space invaders" },
  {id: 'p8', name: "Pacperson" },
];

type ProjectSummaryById = Map<string, IProjectSummary>;

let projectSummaries: ProjectSummaryById = (() => {
    let summaries: ProjectSummaryById = new Map<string, IProjectSummary>();
    dummyProjectSummaries.forEach((p) => {
        summaries.set(p.id, p);
    });
    return summaries;
})();

type ProjectContentById = Map<string, IProjectContent>;

const initialProjectContent = (summary: IProjectSummary): IProjectContent => {
  return {
    id: summary.id,
    codeText: `# This is project ${summary.name}\n`,
    assets: [{name: "banana.png", mimeType: "image/png", id: "a1"},
             {name: "fanfare.mp3", mimeType: "audio/mpeg", id: "a2"}],
  };
};

let projectContents: ProjectContentById = (() => {
    let projects: ProjectContentById = new Map<string, IProjectContent>();
    projectSummaries.forEach((p, id) => {
        projects.set(p.id, initialProjectContent(p));
    });
    return projects;
})();

let nextId = 9;  // To match last dummy project having "p8"

export const createNewProject = async (name: string): Promise<IProjectSummary> => {
  let id = "p" + nextId;
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

const getContent = async (id: string): Promise<IProjectContent> => {
  const maybeContent = projectContents.get(id);
  if (typeof maybeContent === "undefined")
      throw Error(`could not find content for ${id}`);
  return maybeContent as IProjectContent;
}

export const loadContent = async (id: string): Promise<IProjectContent> => {
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

type AssetDataById = Map<string, ArrayBuffer>;

const assetDataById: AssetDataById = new Map<string, ArrayBuffer>();

const octetString = (() => {
  const strings = [];
  for (let i = 0; i <= 0xff; ++i)
    strings.push(i.toString(16).padStart(2, "0"));
  return strings;
})();

const hexOfBuffer = (data: ArrayBuffer): string => {
  const u8s = new Uint8Array(data);
  const octetStrings = new Array(u8s.length);
  for (let i = 0; i != u8s.length; ++i)
    octetStrings[i] = octetString[u8s[i]];
  return octetStrings.join("");
}

const idOfAsset = async (assetData: ArrayBuffer): Promise<string> => {
  const hash = await window.crypto.subtle.digest({name: "SHA-256"}, assetData);
  return hexOfBuffer(hash);
}
