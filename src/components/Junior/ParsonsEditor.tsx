
type ParsonsEditorProps = {
    content: number[] | null// ParsonsBlock[] | null ??????
}

export const ParsonsEditor: React.FC<ParsonsEditorProps> = ({
 content 
}) => {
	return(
		<div background-color:red>
			<h1>I'm a Pasons Editior</h1>
			<div>
				{content?.map((a) => {
					return (
						<p>{a}</p>
					);
				})}
			</div>
			{/* add a check & hint button */}
		</div>
	)
}

