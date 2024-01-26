import { ITutorialSummary } from "../model/tutorials";
import {
  TutorialId,
  ITutorialContent,
  tutorialContentFromHTML,
  tutorialUrl,
  patchImageSrcURLs,
  tutorialResourceText,
} from "../model/tutorial";
import { failIfNull } from "../utils";

// TODO: handle malformed JSON
export const allTutorialSummaries = async () => {
  const indexDiv = document.createElement("div");

  const rawHTML = await tutorialResourceText("tutorial-index.html");
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
  const rawHTML = await tutorialResourceText(`${slug}/tutorial.html`);
  return tutorialContentFromHTML(slug, rawHTML);
};

export const tutorialAssetURLs = async (
  slug: TutorialId
): Promise<Array<string>> => {
  const assetsJson = await tutorialResourceText(`${slug}/project-assets.json`);
  const assetRawURLs = JSON.parse(assetsJson);
  const assetURLs = assetRawURLs.map(tutorialUrl);
  console.log(assetURLs);
  return assetURLs;
};
