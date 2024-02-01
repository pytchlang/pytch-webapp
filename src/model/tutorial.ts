import { failIfNull, isDivOfClass } from "../utils";
import { envVarOrFail } from "../env-utils";
import { PytchProgramKind } from "./pytch-program";

export interface ITutorialChapter {
  title: string;
  maybeNextTitle: string | null;
  maybePrevTitle: string | null;
  hasRunProjectMarker: boolean;
  contentElements: Array<HTMLElement>;
}

export type TutorialId = string; // The slug.  TODO: Replace with more proper id?

export interface ITutorialContent {
  slug: TutorialId;
  programKind: PytchProgramKind;
  initialCode: string;
  completeCode: string;
  chapters: Array<ITutorialChapter>;
  workInProgressChapter: number | null;
}

export const tutorialUrl = (relativeUrl: string) => {
  const tutorialsDataRoot = envVarOrFail("VITE_TUTORIALS_BASE");
  return [tutorialsDataRoot, relativeUrl].join("/");
};

export const tutorialResourceText = async (
  relativeUrl: string
): Promise<string> => {
  const url = tutorialUrl(relativeUrl);
  const response = await fetch(url);
  return await response.text();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PromiseOfAny = Promise<any>;
export const tutorialResourceParsedJson = async (
  relativeUrl: string
): PromiseOfAny => {
  const url = tutorialUrl(relativeUrl);
  const response = await fetch(url);
  return await response.json();
};

export const patchImageSrcURLs = (slug: string, node: Node) => {
  if (!(node instanceof HTMLElement)) {
    return;
  }
  const elt = node as HTMLElement;

  const imgElts = elt.querySelectorAll("img");
  imgElts.forEach((imgElt) => {
    const img = imgElt as HTMLImageElement;
    const rawSrc = img.getAttribute("src");
    const patchedSrc = tutorialUrl(`${slug}/tutorial-assets/${rawSrc}`);

    // We (hackily) allow the tutorial to communicate the class required
    // for the containing <P> by means of a fragment specifier on the
    // image source URL.  Pick out the fragment and apply it, then use
    // the fragment-less URL as the real SRC of the IMG.

    let patchedSrcUrl = new URL(patchedSrc, window.location.href);
    const srcHash = patchedSrcUrl.hash;
    patchedSrcUrl.hash = "";

    img.src = patchedSrcUrl.toString();

    if (srcHash !== "") {
      const hashContent = srcHash.substring(1);
      // As rendered by the tutorial compiler, all IMGs are inside Ps,
      // and it's more useful to attach the class to that P.  (E.g., it
      // lets us do text-align: center.)
      (img.parentNode as HTMLParagraphElement).classList.add(hashContent);
    }
  });
};

export const codeJustBeforeWipChapter = (
  tutorial: ITutorialContent
): string => {
  const chapterIndex = failIfNull(
    tutorial.workInProgressChapter,
    "no WiP chapter"
  );

  if (chapterIndex <= 1) {
    return tutorial.initialCode;
  }

  // Search for the latest patch-container strictly before the start of
  // the current chapter.

  for (
    let probeChapterIdx = chapterIndex - 1;
    probeChapterIdx > 0;
    probeChapterIdx -= 1
  ) {
    const probeElements = tutorial.chapters[probeChapterIdx].contentElements;
    for (
      let probeElementIdx = probeElements.length - 1;
      probeElementIdx > 0;
      probeElementIdx -= 1
    ) {
      const probeElement = probeElements[probeElementIdx];
      if (isDivOfClass(probeElement, "patch-container")) {
        return failIfNull(
          probeElement.dataset.codeAsOfCommit,
          "no code-as-of-commit"
        );
      }
    }
  }

  // Give up and return something sane at least.
  return "import pytch\n";
};

const titleOfChapterDiv = (chapterDiv: HTMLDivElement): string => {
  const classes = chapterDiv.classList;
  if (classes.contains("front-matter")) {
    const titleElt = failIfNull(
      chapterDiv.querySelector("h1"),
      "could not find H1 in front-matter for title"
    );
    return titleElt.innerText;
  }
  if (classes.contains("chapter-content")) {
    const titleElt = failIfNull(
      chapterDiv.querySelector("h2"),
      "could not find H2 in chapter-content for title"
    );
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
    hasRunProjectMarker: false,
    contentElements: content,
  };
};

export const tutorialContentFromHTML = (
  slug: string,
  html: string
): ITutorialContent => {
  const div = document.createElement("div");
  div.innerHTML = html;

  const bundle = div.childNodes[0] as HTMLDivElement;

  patchImageSrcURLs(slug, bundle);

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

  chapters[0].hasRunProjectMarker =
    frontMatter.querySelector(".run-finished-project") != null;

  const initialCode = failIfNull(
    frontMatter.dataset.initialCodeText,
    "tutorial did not supply initial code in front matter"
  );

  const completeCode = failIfNull(
    frontMatter.dataset.completeCodeText,
    "tutorial did not supply complete code in front matter"
  );

  const maybeWipChapter = frontMatter.dataset.seekToChapter;
  const workInProgressChapter = maybeWipChapter ? +maybeWipChapter : null;

  // TODO: Proper parsing / validation of metadata.
  const programKind: PytchProgramKind =
    JSON.parse(bundle.dataset.metadataJson ?? "{}").programKind ?? "flat";

  return {
    slug,
    programKind,
    initialCode,
    completeCode,
    chapters,
    workInProgressChapter,
  };
};
