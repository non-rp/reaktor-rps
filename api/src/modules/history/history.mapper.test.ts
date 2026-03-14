import { describe, expect, it } from "vitest";
import { serializeMatch } from "./history.mapper";

describe("serializeMatch", () => {
	it("converts bigint time into a string", () => {
		const result = serializeMatch({
			id: 1,
			gameId: "game-1",
			time: 1710460800000n,
			playerAId: 10,
			playerBId: 20,
			playerAMove: "rock",
			playerBMove: "paper",
			playerAMoveValid: true,
			playerBMoveValid: true,
			isValid: true,
			invalidReason: null,
			result: "B",
			winnerId: 20,
			createdAt: new Date("2026-03-14T00:00:00.000Z"),
			playerA: {
				id: 10,
				name: "Alice"
			},
			playerB: {
				id: 20,
				name: "Bob"
			}
		});

		expect(result.time).toBe("1710460800000");
		expect(result.playerA.name).toBe("Alice");
	});
});
