import { describe, expect, it } from "vitest";
import { getWinner, validateMove } from "./winner";

describe("validateMove", () => {
	it("normalizes casing and whitespace for valid moves", () => {
		expect(validateMove("  Rock ")).toEqual({
			raw: "  Rock ",
			normalized: "rock",
			isValid: true
		});
	});

	it("marks unsupported moves as invalid", () => {
		expect(validateMove("lizard")).toEqual({
			raw: "lizard",
			normalized: "lizard",
			isValid: false
		});
	});
});

describe("getWinner", () => {
	it("returns DRAW when moves are the same", () => {
		expect(getWinner("rock", "rock")).toBe("DRAW");
	});

	it("returns A when player A wins", () => {
		expect(getWinner("rock", "scissors")).toBe("A");
		expect(getWinner("paper", "rock")).toBe("A");
		expect(getWinner("scissors", "paper")).toBe("A");
	});

	it("returns B when player B wins", () => {
		expect(getWinner("scissors", "rock")).toBe("B");
	});
});
