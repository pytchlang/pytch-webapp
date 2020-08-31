import { IProjectSummary } from "../model/projects";

const dummyProjects: Array<IProjectSummary> = [
  {id: "p1", name: "Bash the zombies", summary: "Run round splatting zombies."},
  {id: "p2", name: "Bike game"},
];

const delay = (ms: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  })
}

export const loadAllSummaries = async (): Promise<Array<IProjectSummary>> => {
  console.log("db.loadAllSummaries(): entering");
  await delay(500);
  console.log("db.loadAllSummaries(): about to return");
  return dummyProjects;
}
