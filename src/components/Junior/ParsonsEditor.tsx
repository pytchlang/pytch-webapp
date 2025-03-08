import { useState } from "react";
import { Uuid } from "../../model/junior/structured-program";
import { ParsonsBlock, PlacedParsonsBlock } from "../../model/junior/structured-program/event";
import { useStoreActions } from "../../store";
import { ParsonsBlockDisplay } from "./ParsonsBlockDisplay";
import { Button, ButtonGroup } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type ParsonsEditorProps = {
  content: Array<PlacedParsonsBlock>;
  actorId: Uuid;
  handlerId: Uuid;
}
  
export const ParsonsEditor: React.FC<ParsonsEditorProps> = ({
	content,
	actorId,
	handlerId
}) => {
  const removeParsonsBlockAction = useStoreActions(a=>a.activeProject.removeParsonsBlock);
  const removeParsonsBlock = (block: ParsonsBlock) => removeParsonsBlockAction({actorId, handlerId, blockId: block.id});

  const indentParsonsBlockAction = useStoreActions(a=>a.activeProject.indentParsonsBlock);
	const indentBlock = (blockIndex: number, positiveChange: boolean) => indentParsonsBlockAction({actorId, handlerId, blockIndex, positiveChange});

	const [showFeedback, setShowFeedback] = useState(false)
	const checkAnswer = () => {
		setShowFeedback(!showFeedback);
		// disable button for a few seconds
		// reset showFeeback in a few seconds if answer isn't correct
		// maybe typed feedback?
		// send flag if answer correct so learner task can respond
		// **** this will need to know how many blocks should be in the answer maybe? otherwise it just displays which blocks are right and wrong the sends a flag to say feedback has been requested and the learnertask does the other half
	};
	
	const feedbackColours: Array<string> = ["red", "green", "pink", "white", "black"];
  return(
  	<div style={{position:"relative", zIndex:10}}>
			<div className="answer">
				{content.map((block, idx) => {
					return (
						<div key={block.id} style={{display:"flex", color:feedbackColours[!showFeedback || block.index  == idx ? 4 : 0], backgroundColor:feedbackColours[!showFeedback || block.indent == block.placedIndent ? 3 : 2]}}>
							<ButtonGroup aria-label="Adjust indentation">
								<Button onClick={() => indentBlock(idx, false)} variant="outline-warning" size="sm">
									<FontAwesomeIcon icon="chevron-left" />
								</Button>
								<Button onClick={() => indentBlock(idx, true)} variant="outline-warning" size="sm">
									<FontAwesomeIcon icon="chevron-right" />
								</Button>
							</ButtonGroup>
							<span onClick={() => removeParsonsBlock(block)} style={{paddingLeft:10+15*block.placedIndent}}>
								<ParsonsBlockDisplay actorId={actorId} handlerId={handlerId} block={block} index={idx}/>
							</span>
						</div>
					);
				})}
			</div>
			{/* maybe add a drop spot here for first block to be dragged onto/ for a block to be dragged onto the end of the list */}
			{/* need to update feedback display to support new text style */}
			<Button onClick={checkAnswer} variant="warning" style={{marginTop:15}}>
				Check
			</Button>
  	</div>
  )
}  
  