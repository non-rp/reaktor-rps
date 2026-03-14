import { beforeEach, describe, expect, it, vi } from "vitest";
import { getHistoryDateRange, getMatches } from "./history.service";
import { findHistoryDateRange, findMatches } from "./history.repository";

vi.mock("./history.repository", () => ({
	findHistoryDateRange: vi.fn(),
	findMatches: vi.fn()
}));

describe("history.service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns paginated matches with serialized filters and range", async () => {
		vi.mocked(findMatches).mockResolvedValue({
			matches: [
				{
					id: 1,
					gameId: "game-1",
					time: 1710460800000n,
					playerAId: 1,
					playerBId: 2,
					playerAMove: "rock",
					playerBMove: "paper",
					playerAMoveValid: true,
					playerBMoveValid: true,
					isValid: true,
					invalidReason: null,
					result: "B",
					winnerId: 2,
					createdAt: new Date("2026-03-14T00:00:00.000Z"),
					playerA: { id: 1, name: "Alice" },
					playerB: { id: 2, name: "Bob" }
				}
			],
			total: 1
		});
		vi.mocked(findHistoryDateRange).mockResolvedValue({
			minTime: 1710460800000n,
			maxTime: 1710547200000n
		});

		const from = new Date("2026-03-14T00:00:00.000Z");
		const to = new Date("2026-03-15T00:00:00.000Z");
		const result = await getMatches({
			limit: 25,
			offset: 0,
			from,
			to,
			playerId: 5,
			playerName: "Alice"
		});

		expect(findMatches).toHaveBeenCalledWith(
			expect.objectContaining({
				limit: 25,
				offset: 0,
				from,
				to,
				playerId: 5,
				playerName: "Alice"
			})
		);
		expect(result.items[0]).toMatchObject({
			gameId: "game-1",
			time: "1710460800000"
		});
		expect(result.range).toEqual({
			from: "2024-03-15",
			to: "2024-03-16"
		});
		expect(result.filters).toEqual(
			expect.objectContaining({
				from: from.toISOString(),
				to: to.toISOString(),
				playerId: 5,
				playerName: "Alice"
			})
		);
	});

	it("returns null range values when history is empty", async () => {
		vi.mocked(findHistoryDateRange).mockResolvedValue({
			minTime: null,
			maxTime: null
		});

		await expect(getHistoryDateRange()).resolves.toEqual({
			from: null,
			to: null
		});
	});
});
