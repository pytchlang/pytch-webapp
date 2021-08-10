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
