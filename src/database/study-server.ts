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
