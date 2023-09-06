import { StageWithControls } from "../StageWithControls";
import { ActorsList } from "./ActorsList";

export const StageAndActorsList = () => {
  return (
    <div className="Junior-StageAndActorsList">
      <StageWithControls forFullScreen={false} />
      <ActorsList />
    </div>
  );
};
