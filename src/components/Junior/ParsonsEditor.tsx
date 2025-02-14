import { ParsonsBlock } from "../../model/junior/structured-program/event";

type ParsonsEditorProps = {
    content: ParsonsBlock[] | null// ParsonsBlock[] | null ??????
}

export const ParsonsEditor: React.FC<ParsonsEditorProps> = ({
 content 
}) => {
	return(
		<div background-color:red>
			<h1>I'm a Parsons Editior</h1>
			<div>
				{content?.map((a) => {
					return (
						<div>
							{/* <span><button>indent button</button></span> */}
							<span><p>{a.id}</p></span> 
						</div>
					);
				})}
			</div>
			{/* add a check & hint button */}
		</div>
	)
}

