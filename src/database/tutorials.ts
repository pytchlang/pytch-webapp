import { ITutorialSummary } from "../model/tutorials";
import {
  TutorialId,
  ITutorialChapter,
  ITutorialContent,
} from "../model/tutorial";

const tutorialsDataRoot: string = "//localhost:8124/tutorials";

const tutorialUrl = (relativeUrl: string) =>
  [tutorialsDataRoot, relativeUrl].join("/");

const patchImageSrcURLs = (slug: string, node: Node) => {
  const elt = node as HTMLElement;
  if (elt == null) {
    return;
  }

  const screenshotImgs = elt.querySelectorAll("p.image-container > img");
  screenshotImgs.forEach((imgElt) => {
    const img = imgElt as HTMLImageElement;
    const rawSrc = img.getAttribute("src");
    img.src = tutorialUrl(`${slug}/tutorial-assets/${rawSrc}`);
  });
};

export const allTutorialSummaries = async () => {
  const indexDiv = document.createElement("div");

  const rawResp = await fetch(tutorialUrl("tutorial-index.html"));
  const rawHTML = await rawResp.text();
  indexDiv.innerHTML = rawHTML;

  const summaryDivs = indexDiv.querySelectorAll("div.tutorial-summary");
  const summaries: Array<ITutorialSummary> = [];
  summaryDivs.forEach((elt: Element) => {
    const div = elt as HTMLDivElement;
    if (div == null) {
      throw Error("did not get div");
    }

    const slug = div.dataset.tutorialName;
    if (slug == null) {
      throw Error("no slug found");
    }

    patchImageSrcURLs(slug, div);
    summaries.push({
      slug,
      contentNodes: Array.from(div.childNodes),
    });
  });

  return summaries;
};

/** We can't fill in all the details of the chapter just from the
 * content div in isolation, because we don't know the prev/next
 * relationships.  The caller will have to fill those in themselves. */
export const protoChapterFromDiv = (
  chapterDiv: HTMLDivElement
): ITutorialChapter => {
  let content: Array<HTMLElement> = [];
  chapterDiv.childNodes.forEach((node) => {
    const elt = node as HTMLElement;
    if (elt == null) {
      throw Error("got a non-HTMLElement child of top-level chapter div");
    }

    // TODO: Add interactive elements to patch tables.
    content.push(elt);
  });

  return {
    title: "A CHAPTER",
    maybeNextTitle: null,
    maybePrevTitle: null,
    contentNodes: content,
  };
};

export const tutorialContent = async (
  slug: TutorialId
): Promise<ITutorialContent> => {
  const div = document.createElement("div");
  const url = tutorialUrl(`${slug}/tutorial.html`);
  const rawResp = await fetch(url);
  const rawHTML = await rawResp.text();
  div.innerHTML = rawHTML;

  const bundle = div.childNodes[0] as HTMLDivElement;

  const chapters: Array<ITutorialChapter> = [];
  bundle.childNodes.forEach((chapterNode) => {
    const chapterElt = chapterNode as HTMLDivElement;
    if (chapterElt == null) {
      throw Error("expecting DIV as top-level child of bundle DIV");
    }
    let chapter = protoChapterFromDiv(chapterElt);
    chapters.push(chapter);
  });

  // Second pass over chapters to set up prev/next relationships.
  const nChapters = chapters.length;
  chapters.forEach((chapter, idx) => {
    chapter.maybePrevTitle = idx > 0 ? chapters[idx - 1].title : null;
    chapter.maybeNextTitle =
      idx < nChapters - 1 ? chapters[idx + 1].title : null;
  });

  console.log(chapters);

  return {
    slug,
    chapters,
    activeChapterIndex: 0,
  };
};
