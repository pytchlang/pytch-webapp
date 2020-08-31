export interface IProjectSummary {
  // TODO: Is this the right place to note whether a project
  // is tracking a tutorial?  Or a separate 'ProjectTutorialBookmark'
  // 'table', thinking in the relational way?

  id: string;
  name: string;
  summary?: string;
}

export interface IProjectCollection {
  available: Array<IProjectSummary>;
}
