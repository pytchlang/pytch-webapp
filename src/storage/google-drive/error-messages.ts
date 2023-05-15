const humanReadableErrorMessage = (rawReason: string | undefined): string => {
  // Some we can say something mildly helpful; otherwise we just have to
  // say "unexpected"/"unknown".

  switch (rawReason) {
    case "authError":
    case "appNotAuthorizedToFile":
    case "insufficientFilePermissions":
      return "Pytch does not have the required permission";

    case "storageQuotaExceeded":
      return "There is not enough space in your Google Drive";

    case "notFound":
      return "The file was not found";

    case "domainPolicy":
      return (
        "Your organisation does not allow Pytch" +
        " access to your Google Drive"
      );

    case "numChildrenInNonRootLimitExceeded":
      return "There are already too many items in the folder";

    case "activeItemCreationLimitExceeded":
      return "There are too many items in your Google Drive";

    case "badRequest":
    case "dailyLimitExceeded":
    case "userRateLimitExceeded":
    case "rateLimitExceeded":
    case "sharingRateLimitExceeded":
    case "invalidSharingRequest":
      return "An unexpected error occurred";

    default:
      return "An unknown error occurred";
  }
};

const detailedMessage = (rawReason: string | undefined): string => {
  const humanReason = humanReadableErrorMessage(rawReason);
  const suffix = rawReason == null ? "" : ` (code "${rawReason}")`;
  return `${humanReason}${suffix}`;
};

/** If the given `response` indicates success, do nothing.  If the given
 * `response` indicates failure, throw an `Error` which combines the
 * given `errorMessageStem` with, where possible, a human-readable
 * description of what went wrong. */
export async function throwIfResponseNotOk(
  errorMessageStem: string,
  response: Response
) {
  if (response.ok) return;

  let responseObj = null;
  try {
    responseObj = await response.json();
  } catch (err) {
    console.log(
      "throwIfResponseNotOK(): failed to parse body as JSON",
      errorMessageStem,
      err
    );
  }

  const rawReason = responseObj?.error?.errors?.[0]?.reason;
  const reason = detailedMessage(rawReason);
  throw new Error(`${errorMessageStem}: ${reason}`);
}
