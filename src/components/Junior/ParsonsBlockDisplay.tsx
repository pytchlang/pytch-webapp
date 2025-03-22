import React from "react";
import { ParsonsBlock, PlacedParsonsBlock } from "../../model/junior/structured-program/event";
import { Uuid } from "../../model/junior/structured-program";
import { useParsonsBlockDrag, useParsonsBlockDrop } from "./hooks";
import RawElement from "../RawElement";

type ParsonsBlockDisplayProps = {
	actorId: Uuid;
	handlerId: Uuid;
	block: PlacedParsonsBlock | ParsonsBlock;
	index: number;
};
export const ParsonsBlockDisplay: React.FC<ParsonsBlockDisplayProps> = ({ actorId, handlerId, block, index }) => {
	const dragRef = useParsonsBlockDrag(handlerId, block);
	const dropRef = useParsonsBlockDrop(actorId, handlerId, index);

	return (
		<span ref={dropRef}>
			<span ref={dragRef}>
				<RawElement element={block.code} />
				</span>
		</span>
	)
}
