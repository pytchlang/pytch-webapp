import React from "react";
import { StructuredProgramOps, Uuid } from "../../../model/junior/structured-program";
import { EventDescriptor, EventHandlerEditMode, ParsonsBlock } from "../../../model/junior/structured-program/event";
import { useStoreActions } from "../../../store";
import { useJrEditState, useMappedProgram } from "../hooks";
import { useMappedLinkedJrTutorial } from "./hooks";
import { Button } from "react-bootstrap";
import { ParsonsPuzzleProps } from "../../../model/junior/jr-tutorial";
import { ParsonsBlockDisplay } from "../ParsonsBlockDisplay";

export const ParsonsPuzzle: React.FC<ParsonsPuzzleProps> = ({ handlerKind, puzzleBlocks }) => {
	const puzzleState = useMappedLinkedJrTutorial((t) => t.interactionState.puzzleState);
	const setPuzzleState = useStoreActions((a) => a.activeProject.setPuzzleState);
	const focusedActor = useJrEditState((a) => a.focusedActor);
	const setPythonCodeToPuzzleLen = useStoreActions((a) => a.activeProject.setHandlerPythonCode)
	const addNewHandlerAction = useStoreActions(a=>a.activeProject.upsertHandler);
	const onAddNewHandler = (id: Uuid, trigger: EventDescriptor) => addNewHandlerAction({ action: { kind:"insert" }, actorId: id, eventDescriptor:trigger });
	const deleteHandlerAction = useStoreActions(a=>a.activeProject.deleteHandler);
	const onDeleteHandler = (actorId: Uuid, handlerId: Uuid) => deleteHandlerAction({ actorId, handlerId });
	const editModeUpdateAction = useStoreActions(a=>a.activeProject.setHandlerEditMode);
	const onEditModeUpdate = (actorId: Uuid, handlerId: Uuid, mode: EventHandlerEditMode) => editModeUpdateAction({ actorId, handlerId, mode });
	const addParsonsBlockAction = useStoreActions(a=>a.activeProject.addParsonsBlock);
	const onAddParsonsBlock = (actorId: Uuid, handlerId: Uuid, block: ParsonsBlock) => addParsonsBlockAction({ actorId, handlerId, block, targetIndex: -1 });  // also call on end/skip/delete(?) puzzle with the appropriate 
	// *********** will i need this to set the puzzlestate.actorid as the focused actor or will it always open on the most recently focused actor?
	// *** ANSWER: yes but it needs to be done wherever state is loaded from save
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
    let currentActorId = focusedActor;
    let parsonsHandlerId = onAddNewHandler(currentActorId, { kind: handlerKind });
    onEditModeUpdate(currentActorId, parsonsHandlerId, "parsons");
		setPythonCodeToPuzzleLen({ actorId: currentActorId, handlerId: parsonsHandlerId, code: puzzleBlocks.length.toString()})
    setPuzzleState({ state: "in-progress", actorId: currentActorId, handlerId: parsonsHandlerId });
  };
  
  const quitPuzzle = () => {
		if (puzzleState.state == "in-progress") {
			onDeleteHandler(puzzleState.actorId, puzzleState.handlerId);
			setPuzzleState({ state: "not-started" });
		}
  }

  const moveBlock = (block: ParsonsBlock) => {
    if(puzzleState.state == "in-progress") {
    	onAddParsonsBlock(puzzleState.actorId, puzzleState.handlerId, block);
		} else {
			console.error("ERROR: Puzzle not started")
		}
	}

	return (
		<> 
		{puzzleState.state != "finished" ? (
			<>
				<Button
				disabled={puzzleState.state != "not-started"}
				variant="success" onClick={startPuzzle}
				style={{marginTop:10, marginBottom:20}}
				>
					Start Parsons Puzzle
				</Button>
				{unusedBlocks.map((block) => {
					return (
						<div key={block.id} onClick={() => moveBlock(block)} style={{display:"flex"}}>
							<ParsonsBlockDisplay 
							actorId={puzzleState.state == "in-progress" ? puzzleState.actorId : ""}
							handlerId={puzzleState.state == "in-progress" ? puzzleState.handlerId : ""}
							block={block}
							index={-1}
							/>
						</div>
					)
				})}
				{puzzleState.state == "in-progress" ? (
					<Button
					variant="outline-success" onClick={quitPuzzle}
					style={{marginTop:10, marginBottom:20}}
					>
						Quit Puzzle
					</Button>):(<></>)}
			</>
		):(
			<div>
				Well done! You've completed the puzzle. Click the checkbox to continue to the next task.
			</div>
		)}
		</>
	)
}