import { Uuid } from "../../model/junior/structured-program";
import { ParsonsBlock } from "../../model/junior/structured-program/event";
import { useStoreActions } from "../../store";

type ParsonsEditorProps = {
  content: Array<ParsonsBlock>;
  actorId: Uuid;
  handlerId: Uuid;
}
  
export const ParsonsEditor: React.FC<ParsonsEditorProps> = ({
	content,
	actorId,
	handlerId
}) => {
  const removeParsonsBlockAction = useStoreActions(a=>a.activeProject.removeParsonsBlock);
  const removeParsonsBlock = (block: ParsonsBlock) => removeParsonsBlockAction({actorId, handlerId, block})
    
  return(
  	<div>
			<h1>I'm a Parsons Editior</h1>
			<div className="answer">
				{content.map((block) => {
					return (
						<button key={block.id} style={{position:"relative", zIndex:10}} onClick={() => removeParsonsBlock(block)}>
							{block.id}
							{/* <span><button>indent button</button></span> */}
							{/* <span><p>{a.id}</p></span>  */}
						</button>
					);
				})}
			</div>
			{/* add a check & hint button */}
  	</div>
  )
  }
  
  