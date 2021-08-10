import React from "react";

const maybeJoinStudyCode = () => {
  const joinMatcher = new RegExp("/join/([0-9a-f-]*)$");
  const joinMatch = joinMatcher.exec(window.location.href);
  return joinMatch == null ? null : joinMatch[1];
};

export const StudySessionManager = () => {
  return (
    <div className="App">
    </div>
  );
};
