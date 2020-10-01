import { ITutorialSummary } from "../model/tutorials";
import {
  TutorialId,
  ITutorialContent,
  tutorialContentFromHTML,
} from "../model/tutorial";
import { failIfNull } from "../utils";

const tutorialsDataRoot = failIfNull(
  process.env.REACT_APP_TUTORIALS_BASE,
  "must set REACT_APP_TUTORIALS_BASE env.var"
);

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
    const slug = failIfNull(div.dataset.tutorialName, "no slug found");

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
  const url = tutorialUrl(`${slug}/tutorial.html`);
  const rawResp = await fetch(url);
  const rawHTML = await rawResp.text();
  return tutorialContentFromHTML(slug, rawHTML);
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
