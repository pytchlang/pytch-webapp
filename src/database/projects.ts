import { IProjectSummary } from "../model/projects";

const dummyProjects: Array<IProjectSummary> = [
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

let projects: ProjectSummaryById = (() => {
    let projects: ProjectSummaryById = new Map<string, IProjectSummary>();
    dummyProjects.forEach((p) => {
        projects.set(p.id, p);
    });
    return projects;
})();

const delay = (ms: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  })
}

export const loadAllSummaries = async (): Promise<Array<IProjectSummary>> => {
  console.log("db.loadAllSummaries(): entering");
  await delay(500);
  console.log("db.loadAllSummaries(): about to return");
  return Array.from(projects.values());
}
