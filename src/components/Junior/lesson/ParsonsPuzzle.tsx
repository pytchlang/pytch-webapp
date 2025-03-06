import React from "react";
import { StructuredProgramOps, Uuid } from "../../../model/junior/structured-program";
import { EventDescriptor, EventHandlerEditMode, ParsonsBlock } from "../../../model/junior/structured-program/event";
import { useStoreActions } from "../../../store";
import { useJrEditState, useMappedProgram } from "../hooks";
import { useMappedLinkedJrTutorial } from "./hooks";
import { Button } from "react-bootstrap";
import { ParsonsPuzzleProps } from "../../../model/junior/jr-tutorial";

export const ParsonsPuzzle: React.FC<ParsonsPuzzleProps> = ({ handlerKind, completeCode, puzzleBlocks }) => {
	const puzzleState = useMappedLinkedJrTutorial((t) => t.interactionState.puzzleState);
	const setPuzzleState = useStoreActions((a) => a.activeProject.setPuzzleState);
	const focusedActor = useJrEditState((a) => a.focusedActor);
	const addNewHandlerAction = useStoreActions(a=>a.activeProject.upsertHandler);
	const onAddNewHandler = (id: Uuid, trigger: EventDescriptor) => addNewHandlerAction({ action: { kind:"insert" }, actorId: id, eventDescriptor:trigger });
	const editModeUpdateAction = useStoreActions(a=>a.activeProject.setHandlerEditMode);
	const onEditModeUpdate = (actorId: Uuid, handlerId: Uuid, mode: EventHandlerEditMode) => editModeUpdateAction({ actorId, handlerId, mode });
	const addParsonsBlockAction = useStoreActions(a=>a.activeProject.addParsonsBlock);
	const onAddParsonsBlock = (actorId: Uuid, handlerId: Uuid, block: ParsonsBlock) => addParsonsBlockAction({ actorId, handlerId, block });  // also call on end/skip/delete(?) puzzle with the appropriate 
	// *********** will i need this to set the puzzlestate.actorid as the focused actor or will it always open on the most recently focused actor?
	// const setFocusedActorAction = useJrEditActions((a) => a.setFocusedActor);
  // const setFocusedActor = (id: string) => setFocusedActorAction(id);

	const unusedBlocks = useMappedProgram("<LearnerTask>", (program) => {
    if(puzzleState.state == "in-progress") {
      const handler = StructuredProgramOps.uniqueHandlerByIdGlobally(program, puzzleState.handlerId);
      return puzzleBlocks.filter((block) => handler.ParsonsBlocks.every(b => b.id !== block.id));
    }
    else return [];
  });
	

  // consider moving to a thunk
  const startPuzzle = () => {
    console.log("start");
		
    let currentActorId = focusedActor;
    let parsonsHandlerId = onAddNewHandler(currentActorId, { kind: handlerKind });
    onEditModeUpdate(currentActorId, parsonsHandlerId, "parsons");
    setPuzzleState({ state: "in-progress", actorId: currentActorId, handlerId: parsonsHandlerId });
  };    

  const moveBlock = (block: ParsonsBlock) => {
    if(puzzleState.state == "in-progress") {
    	onAddParsonsBlock(puzzleState.actorId, puzzleState.handlerId, block);
		} else {
			console.error("Puzzle not started")
		}
    console.log("add" + block.id);
    console.log(unusedBlocks);
	}

	if(puzzleState.state == "in-progress") {
		console.log("handler id: " + puzzleState.handlerId)
		console.log("actor id: " + puzzleState.actorId)
		console.log("puzzle state: " + puzzleState.state)
	}

	return (
		<>
			<Button disabled={puzzleState.state != "not-started"} variant="success" onClick={startPuzzle}>Start Parsons Puzzle</Button>
			{unusedBlocks.map((block) => {
				return (
					<div key={block.id} onClick={() => moveBlock(block)}>{block.code}</div>
				)
			})}
		</>
	)
}