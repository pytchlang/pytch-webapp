import { useState } from "react";
import { Uuid } from "../../model/junior/structured-program";
import { ParsonsBlock, PlacedParsonsBlock } from "../../model/junior/structured-program/event";
import { useStoreActions } from "../../store";
import { ParsonsBlockDisplay } from "./ParsonsBlockDisplay";
import { Button, ButtonGroup } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParsonsBlockDrop } from "./hooks";

type ParsonsEditorProps = {
  content: Array<PlacedParsonsBlock>;
  len: number; 
  actorId: Uuid;
  handlerId: Uuid;
}
  
export const ParsonsEditor: React.FC<ParsonsEditorProps> = ({
	content,
	len, // may not be the best way to do this but setting it as the python code seemed to be the most straightforward thing
	actorId,
	handlerId
}) => {
  const removeParsonsBlockAction = useStoreActions(a=>a.activeProject.removeParsonsBlock);
  const removeParsonsBlock = (block: ParsonsBlock) => removeParsonsBlockAction({ actorId, handlerId, blockId: block.id });
  const indentParsonsBlockAction = useStoreActions(a=>a.activeProject.indentParsonsBlock);
	const indentBlock = (blockIndex: number, positiveChange: boolean) => indentParsonsBlockAction({ actorId, handlerId, blockIndex, positiveChange });
  const reorderParsonsBlocksAction = useStoreActions(a=>a.activeProject.reorderBlocks);
	const reorderBlocks = (movingBlock: ParsonsBlock, targetBlockIndex: number) => reorderParsonsBlocksAction({ actorId, handlerId, movingBlock, targetBlockIndex });
	const setPythonCodeAction = useStoreActions(a=>a.activeProject.setHandlerPythonCode);
	const setPythonCode = (code: string) => setPythonCodeAction({ actorId, handlerId, code });
	const setHandlerEditModeToFreeAction = useStoreActions(a=>a.activeProject.setHandlerEditMode);
	const setHandlerEditModeToFree = () => setHandlerEditModeToFreeAction({ actorId, handlerId, mode:"free" }) 
	const setPuzzleState = useStoreActions((a) => a.activeProject.setPuzzleState);

	const [showFeedback, setShowFeedback] = useState(false)
	const [descriptiveFeedback, setDescriptiveFeedback] = useState("")
	const [disableCheckButton, setDisableCheckButton] = useState(false)
	const checkAnswer = () => {
		setShowFeedback(true);
		setTimeout(() => setShowFeedback(false), 5000);
		setDisableCheckButton(true);
		setTimeout(() => {
			setDisableCheckButton(false);
			setDescriptiveFeedback("");
		}, 15000);

		// maybe add descriptive feedback?
		if(len == content.length) {
			let completeCode = "";
			let correct = true;
			let badIndent = false;
			let badIndex = false;
			for(const [i, block] of content.entries()) {
				if(block.index != i || block.indent != block.placedIndent) {
					correct = false;
					badIndex = block.index != i ? true : badIndex;
					badIndent = block.indent != block.placedIndent ? true : badIndent;
				}
				for(let j = 0; j < block.placedIndent; j++) {
					completeCode += "\t";
				}
				completeCode += block.code + "\n";
			}
			if(badIndex) {
				setDescriptiveFeedback("Take another look at the order! Remember, your script runs from top to bottom.\n");
			}
			if(badIndent) {
				setDescriptiveFeedback((prev) => prev + "Take another look at the indentation! Remember to indent after colon (:) and to unindent at the end of the loop or statement.");
			}
			if(correct) {
				setPythonCode(completeCode);
				setHandlerEditModeToFree();
				setPuzzleState({ state: "finished" });
			}
		}
	};
	const dropRef = useParsonsBlockDrop(actorId, handlerId, -1);
	
  return(
  	<div style={{position:"relative", zIndex:10}}>
			<div className="answer">
				{content.map((block, idx) => {
					return (
						<div key={block.id} style={{display:"flex", backgroundColor:showFeedback && (block.index  != idx || block.indent != block.placedIndent) ? "pink" : "white"}}>
							<ButtonGroup aria-label="Adjust indentation">
								<Button onClick={() => indentBlock(idx, false)} variant="outline-secondary" size="sm">
									<FontAwesomeIcon icon="chevron-left" />
								</Button>
								<Button onClick={() => indentBlock(idx, true)} variant="outline-secondary" size="sm">
									<FontAwesomeIcon icon="chevron-right" />
								</Button>
							</ButtonGroup>
							<span key={idx} onClick={() => removeParsonsBlock(block)} style={{paddingLeft:10+30*block.placedIndent}}>
								<ParsonsBlockDisplay actorId={actorId} handlerId={handlerId} block={block} index={idx}/>
							</span>
							<span style={{position:"absolute", right:10}}>
								<Button
									variant="outline-secondary"
									className="reorder-up"
									disabled={idx == 0}
									onClick={() => reorderBlocks(block, idx-1)}
									size="sm"
									style={{justifySelf:"right", paddingLeft:4, paddingRight:4, paddingTop:2, paddingBottom:2}}
								>
									<FontAwesomeIcon icon="angles-up" />
								</Button>
								<Button
									variant="outline-secondary"
									className="reorder-down"
									disabled={idx == content.length-1}
									onClick={() => reorderBlocks(block, idx+1)}
									size="sm"
									style={{justifySelf:"right", paddingLeft:4, paddingRight:4, paddingTop:2, paddingBottom:2}}
								>
									<FontAwesomeIcon icon="angles-down" />
								</Button>
							</span>
						</div>
					);
				})}
			</div>
			<div ref={dropRef} style={{backgroundColor:"white"}}>
				<Button variant="light" disabled={true} style={{backgroundColor:"white",  marginTop:"5", border:0}}>
					Drop puzzle blocks here &ensp;
					<FontAwesomeIcon icon="plus" />
				</Button>
			</div>
			<div>
				{disableCheckButton ? (
					descriptiveFeedback.split("\n").map((line) => (line != "" ? (
						<Button variant="light" disabled={true} style={{backgroundColor:"pink",  marginTop:5, width:"98%", marginLeft:"1%"}}>
									{line}
						</Button>						
					):(<></>)))
				):(<></>)}
			</div>
			<div>
				<Button onClick={checkAnswer} variant="warning" style={{marginTop:10}} disabled={disableCheckButton}>
					Check
				</Button>
			</div>
  	</div>
  )
}  
  