export const VALID_MOVES = ["rock", "paper", "scissors"] as const;

export type ValidMove = (typeof VALID_MOVES)[number];

export type MatchResult = "A" | "B" | "DRAW" | "INVALID";

export type MoveValidation = {
  raw: string;
  normalized: string;
  isValid: boolean;
};
