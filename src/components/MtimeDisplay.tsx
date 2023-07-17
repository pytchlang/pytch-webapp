import React from "react";
import { format, formatDistanceToNow } from "date-fns";

// The mtime should never be null, but play safe.
type MtimeDisplayProps = { mtime: number | null };
export const MtimeDisplay: React.FC<MtimeDisplayProps> = ({ mtime }) => {
  if (mtime == null) {
    return null;
  }

  const absTimestamp = format(mtime, "PPpp");
  const relTimestamp = formatDistanceToNow(mtime, { addSuffix: true });

  return (
    <p className="project-mtime">
      Modified {relTimestamp} ({absTimestamp})
    </p>
  );
};
