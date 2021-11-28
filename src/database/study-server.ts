export type StudyCode = string;
export type ParticipantCode = string;
export type SessionToken = string;

export type SessionCreationCredentials = {
  studyCode: StudyCode;
  participantCode: ParticipantCode;
};

export type EventDescriptor = {
  kind: string;
  detail: any;
};

// In fact under "rejected" or "error" we also get a "message" property,
// but we ignore it, so we don't bother specifying it here.
export type RequestSessionResponse =
  | { status: "ok"; token: SessionToken }
  | { status: "rejected" }
  | { status: "error" };

// Need to handle within-deployment API servers (for production) as well
// as completely distinct ones (for testing).  Allow a prefix
// "WITHIN-DEPLOYMENT:"; if this is found, strip that prefix and replace
// with PUBLIC_URL, first removing replacing any "/app" suffix of
// PUBLIC_URL with "/".
//
// TODO: This seems very clunky.  Revisit.
//
const apiUrlBase = (() => {
  const rawBase = process.env.REACT_APP_STUDY_API_BASE;
  if (rawBase == null) return null;

  const apiUrlRegexp = /^WITHIN-DEPLOYMENT:(.*)$/;
  const apiUrlMatch = apiUrlRegexp.exec(rawBase);
  if (apiUrlMatch != null) {
    const basePathWithoutAnyAppSuffix = (() => {
      const basePath = process.env.PUBLIC_URL || "/";
      const regexp = new RegExp("(.*)/app$");
      const match = regexp.exec(basePath);
      return match != null ? `${match[1]}/` : basePath;
    })();
    return basePathWithoutAnyAppSuffix + apiUrlMatch[1];
  } else {
    return rawBase;
  }
})();

export const studyEnabled = apiUrlBase != null;

const apiUrl = (relativeUrl: string): string => {
  if (apiUrlBase == null) {
    throw new Error(
      "cannot construct API URL without REACT_APP_STUDY_API_BASE"
    );
  }
  return [apiUrlBase, relativeUrl].join("/");
};

const rawApiRequest = async (method: string, endpoint: string, body: any) => {
  const fullUrl = apiUrl(endpoint);
  const appJson = "application/json";
  const headers = { "Content-Type": appJson, Accept: appJson };
  const maybeBodySlice = body == null ? {} : { body: JSON.stringify(body) };
  const fetchOptions = { method, headers, ...maybeBodySlice };
  const apiResponse = await fetch(fullUrl, fetchOptions);
  const jsonResponse = await apiResponse.json();
  return jsonResponse;
};

const apiRequest = async (
  label: string,
  method: string,
  endpoint: string,
  body: any
) => {
  try {
    return await rawApiRequest(method, endpoint, body);
  } catch (e) {
    console.error(`${label}:`, e);
    return { status: "error" };
  }
};

export const sendSessionHeartbeat = (token: SessionToken) =>
  apiRequest(
    "sendSessionHeartbeat()",
    "POST",
    `sessions/${token}/heartbeat`,
    null
  );

export const requestSession = (
  request: SessionCreationCredentials
): Promise<RequestSessionResponse> =>
  apiRequest("requestSession()", "POST", "sessions", request);

export const signOutSession = (token: SessionToken) =>
  apiRequest("signOutSession()", "DELETE", `sessions/${token}`, null);

export const submitEvent = (
  sessionToken: SessionToken,
  descriptor: EventDescriptor
) =>
  apiRequest(
    "submitEvent()",
    "POST",
    `sessions/${sessionToken}/events`,
    descriptor
  );

////////////////////////////////////////////////////////////////////////
//
// Links to surveys hosted on third-party site.

type SurveyKind = "pre" | "post";

const STUDY_SURVEY_BASE_URL = (() => {
  if (!studyEnabled) {
    return new Map<SurveyKind, string>();
  }

  const urlsStr = process.env.REACT_APP_STUDY_SURVEY_URLS;
  if (urlsStr == null) {
    throw new Error("study enabled but REACT_APP_STUDY_SURVEY_URLS not set");
  }

  const urls = urlsStr.split(" ");
  if (urls.length !== 2) {
    throw new Error(
      "REACT_APP_STUDY_SURVEY_URLS value malformed" +
        " (should have pre/post as two space-separated components)"
    );
  }

  return new Map<SurveyKind, string>([
    ["pre", urls[0]],
    ["post", urls[1]],
  ]);
})();

export const surveyUrl = (
  kind: SurveyKind,
  participantCode: ParticipantCode
): string => {
  if (!studyEnabled) {
    throw new Error("surveyUrl(): study is not enabled");
  }

  const base = STUDY_SURVEY_BASE_URL.get(kind);
  const query = `?ParticipantCode=${participantCode}`;
  return base + query;
};
