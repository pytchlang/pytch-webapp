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

export const tutorialContent = async (
  slug: TutorialId
): Promise<ITutorialContent> => {
  const div = document.createElement("div");
  const url = tutorialUrl(`${slug}/tutorial.html`);
  const rawResp = await fetch(url);
  const rawHTML = await rawResp.text();
  div.innerHTML = rawHTML;

  const contentElements: Array<HTMLElement> = [];
  div.childNodes.forEach((node) => {
    const elt = node as HTMLElement;
    if (elt == null) {
      console.log("skipping non-Element node", node);
    } else {
      contentElements.push(elt);
    }
  });

  const chapter: ITutorialChapter = {
    title: "Chapter EVERYTHING",
    maybeNextTitle: null,
    maybePrevTitle: null,
    contentNodes: contentElements,
  };

  return {
    slug,
    chapters: [chapter],
    activeChapterIndex: 0,
  };
};
