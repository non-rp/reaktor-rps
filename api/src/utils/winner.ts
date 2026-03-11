import type { MatchResult, MoveValidation, ValidMove } from "../types/match";
import { VALID_MOVES } from "../types/match";

export function validateMove(move: string): MoveValidation {
	const normalized = move.trim().toLowerCase();

	return {
		raw: move,
		normalized,
		isValid: VALID_MOVES.includes(normalized as ValidMove)
	};
}

export function getWinner(
	moveA: ValidMove,
	moveB: ValidMove
): MatchResult {
	if (moveA === moveB) return "DRAW";

	if (
		(moveA === "rock" && moveB === "scissors") ||
		(moveA === "scissors" && moveB === "paper") ||
		(moveA === "paper" && moveB === "rock")
	) {
		return "A";
	}

	return "B";
}
