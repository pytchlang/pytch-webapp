export interface ITutorialChapter {
  title: string;
  maybeNextTitle: string | null;
  maybePrevTitle: string | null;
  contentElements: Array<HTMLElement>;
}

export type TutorialId = string; // The slug.  TODO: Replace with more proper id?

export interface ITutorialContent {
  slug: TutorialId;
  initialCode: string;
  completeCode: string;
  chapters: Array<ITutorialChapter>;
}

const titleOfChapterDiv = (chapterDiv: HTMLDivElement): string => {
  const classes = chapterDiv.classList;
  if (classes.contains("front-matter")) {
    const titleElt = chapterDiv.querySelector("h1");
    if (titleElt == null)
      throw Error("could not find H1 in front-matter for title");
    return titleElt.innerText;
  }
  if (classes.contains("chapter-content")) {
    const titleElt = chapterDiv.querySelector("h2");
    if (titleElt == null)
      throw Error("could not find H2 in chapter-content for title");
    return titleElt.innerText;
  }
  throw Error("chapter DIV neither front-matter nor chapter-content");
};

/** We can't fill in all the details of the chapter just from the
 * content div in isolation, because we don't know the prev/next
 * relationships.  The caller will have to fill those in themselves. */
const protoChapterFromDiv = (chapterDiv: HTMLDivElement): ITutorialChapter => {
  let content: Array<HTMLElement> = [];
  chapterDiv.childNodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      throw Error("got a non-HTMLElement child of top-level chapter div");
    }
    const elt = node as HTMLElement;
    content.push(elt);
  });

  return {
    title: titleOfChapterDiv(chapterDiv),
    maybeNextTitle: null,
    maybePrevTitle: null,
    contentElements: content,
  };
};
