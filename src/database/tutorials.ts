import { ITutorialSummary } from "../model/tutorials";
import {
  TutorialId,
  ITutorialContent,
  tutorialContentFromHTML,
  tutorialUrl,
  patchImageSrcURLs,
} from "../model/tutorial";
import { failIfNull } from "../utils";

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

    const metadata_string = div.dataset.metadataJson || "{}";
    const metadata = JSON.parse(metadata_string);
    patchImageSrcURLs(slug, div);
    summaries.push({
      slug,
      contentNodes: Array.from(div.childNodes),
      metadata,
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
