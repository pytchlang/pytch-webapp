import { ITutorialSummary } from "../model/tutorials";
import {
  TutorialId,
  ITutorialChapter,
  ITutorialContent,
} from "../model/tutorial";

const tutorialsDataRoot = process.env.REACT_APP_TUTORIALS_BASE;

if (tutorialsDataRoot == null) {
  throw Error("must set REACT_APP_TUTORIALS_BASE env.var");
}

const tutorialUrl = (relativeUrl: string) =>
  [tutorialsDataRoot, relativeUrl].join("/");

const patchImageSrcURLs = (slug: string, node: Node) => {
  if (!(node instanceof HTMLElement)) {
    return;
  }
  const elt = node as HTMLElement;

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
    if (!(chapterNode instanceof HTMLDivElement)) {
      throw Error("expecting DIV as top-level child of bundle DIV");
    }
    const chapterElt = chapterNode as HTMLDivElement;
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

  const frontMatter = bundle.childNodes[0] as HTMLDivElement;

  const initialCode = frontMatter.dataset.initialCodeText;
  if (initialCode == null) {
    throw Error("tutorial did not supply initial code in front matter");
  }
  const completeCode = frontMatter.dataset.completeCodeText;
  if (completeCode == null) {
    throw Error("tutorial did not supply complete code in front matter");
  }

  return {
    slug,
    initialCode,
    completeCode,
    chapters,
  };
};

export const tutorialAssetURLs = async (
  slug: TutorialId
): Promise<Array<string>> => {
  const assetListURL = tutorialUrl(`${slug}/project-assets.json`);
  const rawResp = await fetch(assetListURL);
  const assetListJson = await rawResp.text();
  const assetRawURLs = JSON.parse(assetListJson);
  const assetURLs = assetRawURLs.map(tutorialUrl);
  console.log(assetURLs);
  return assetURLs;
};
