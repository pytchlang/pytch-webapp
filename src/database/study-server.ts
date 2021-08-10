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

const apiUrlBase = process.env.REACT_APP_STUDY_API_BASE;
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

export const submitEvent = (token: SessionToken, descriptor: EventDescriptor) =>
  apiRequest("submitEvent()", "POST", `sessions/${token}/events`, descriptor);
