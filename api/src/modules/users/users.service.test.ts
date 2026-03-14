import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	buildDefaultLeaderboardRange,
	getLeaderboard,
	getUserProfile,
	listUsers
} from "./users.service";
import {
	findLeaderboard,
	findUserById,
	findUsers,
	getUserStats
} from "./users.repository";
import { getMatches } from "../history/history.service";

vi.mock("./users.repository", () => ({
	findLeaderboard: vi.fn(),
	findUserById: vi.fn(),
	findUsers: vi.fn(),
	getUserStats: vi.fn()
}));

vi.mock("../history/history.service", () => ({
	getMatches: vi.fn()
}));

describe("users.service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("serializes list response and win rate", async () => {
		vi.mocked(findUsers).mockResolvedValue({
			items: [
				{
					id: 1,
					name: "Alice",
					matches: 4,
					wins: 3,
					losses: 1,
					draws: 0,
					invalidMatches: 0
				}
			],
			total: 1
		});

		const from = new Date("2026-03-14T00:00:00.000Z");
		const to = new Date("2026-03-15T00:00:00.000Z");
		const result = await listUsers({
			limit: 10,
			offset: 5,
			from,
			to,
			query: "ali",
			sortBy: "wins",
			sortOrder: "desc"
		});

		expect(result.items[0].winRate).toBe(0.75);
		expect(result.filters).toEqual({
			query: "ali",
			from: from.toISOString(),
			to: to.toISOString(),
			sortBy: "wins",
			sortOrder: "desc"
		});
	});

	it("returns ranked leaderboard rows", async () => {
		vi.mocked(findLeaderboard).mockResolvedValue({
			items: [
				{
					id: 2,
					name: "Bob",
					matches: 2,
					wins: 2,
					losses: 0,
					draws: 0,
					invalidMatches: 0
				}
			],
			total: 1
		});

		const result = await getLeaderboard({
			limit: 10,
			offset: 10,
			from: new Date("2026-03-14T00:00:00.000Z"),
			to: new Date("2026-03-15T00:00:00.000Z")
		});

		expect(result.items[0]).toMatchObject({
			id: 2,
			rank: 11,
			winRate: 1
		});
	});

	it("returns null when requested user does not exist", async () => {
		vi.mocked(findUserById).mockResolvedValue(null);

		await expect(
			getUserProfile(123, {
				limit: 25,
				offset: 0,
				from: undefined,
				to: undefined
			})
		).resolves.toBeNull();
	});

	it("returns combined user profile and match history", async () => {
		vi.mocked(findUserById).mockResolvedValue({ id: 7, name: "Chloe" });
		vi.mocked(getUserStats).mockResolvedValue({
			id: 7,
			name: "Ignored",
			matches: 5,
			wins: 4,
			losses: 1,
			draws: 0,
			invalidMatches: 0
		});
		vi.mocked(getMatches).mockResolvedValue({
			items: [],
			paging: { limit: 25, offset: 0, total: 0 },
			range: { from: null, to: null },
			filters: { from: null, to: null, playerId: 7, playerName: null }
		});

		const result = await getUserProfile(7, {
			limit: 25,
			offset: 0,
			from: undefined,
			to: undefined
		});

		expect(result?.user).toMatchObject({
			id: 7,
			name: "Chloe",
			winRate: 0.8
		});
		expect(getMatches).toHaveBeenCalledWith(
			expect.objectContaining({
				playerId: 7
			})
		);
	});

	it("builds the default leaderboard range from UTC midnight", () => {
		const result = buildDefaultLeaderboardRange();

		expect(result.from.toISOString()).toMatch(/T00:00:00.000Z$/);
		expect(result.to.getTime() - result.from.getTime()).toBe(24 * 60 * 60 * 1000);
	});
});
