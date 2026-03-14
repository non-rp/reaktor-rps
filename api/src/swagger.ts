import path from "path"
import swaggerJsdoc from "swagger-jsdoc"

const port = process.env.PORT || 3000
const serverUrl = process.env.PUBLIC_API_URL || `http://localhost:${port}`

export const swaggerSpec = swaggerJsdoc({
	definition: {
		openapi: "3.0.3",
		info: {
			title: "Reactor RPS API",
			version: "1.0.0",
			description: "API documentation for match history, users, and leaderboard endpoints."
		},
		servers: [
			{
				url: serverUrl
			}
		],
		tags: [
			{ name: "Health", description: "Service health checks" },
			{ name: "History", description: "Match history and sync endpoints" },
			{ name: "Live", description: "Live match stream cache and sync endpoints" },
			{ name: "Users", description: "User profiles and leaderboard endpoints" }
		],
		components: {
			schemas: {
				ApiError: {
					type: "object",
					properties: {
						message: { type: "string", example: "Invalid user id" }
					},
					required: ["message"]
				},
				PlayerRef: {
					type: "object",
					properties: {
						id: { type: "integer", example: 42 },
						name: { type: "string", example: "alice" }
					},
					required: ["id", "name"]
				},
				Match: {
					type: "object",
					properties: {
						id: { type: "integer", example: 1001 },
						gameId: { type: "string", example: "match_abc123" },
						time: {
							type: "string",
							description: "Unix timestamp stored as a string to preserve bigint precision.",
							example: "1741737600000"
						},
						playerAId: { type: "integer", example: 1 },
						playerBId: { type: "integer", example: 2 },
						playerAMove: { type: "string", example: "rock" },
						playerBMove: { type: "string", example: "scissors" },
						playerAMoveValid: { type: "boolean", example: true },
						playerBMoveValid: { type: "boolean", example: true },
						isValid: { type: "boolean", example: true },
						invalidReason: { type: "string", nullable: true, example: null },
						result: { type: "string", example: "player_a_win" },
						winnerId: { type: "integer", nullable: true, example: 1 },
						createdAt: {
							type: "string",
							format: "date-time",
							example: "2026-03-12T10:00:00.000Z"
						},
						playerA: { $ref: "#/components/schemas/PlayerRef" },
						playerB: { $ref: "#/components/schemas/PlayerRef" }
					},
					required: [
						"id",
						"gameId",
						"time",
						"playerAId",
						"playerBId",
						"playerAMove",
						"playerBMove",
						"playerAMoveValid",
						"playerBMoveValid",
						"isValid",
						"result",
						"createdAt",
						"playerA",
						"playerB"
					]
				},
				MatchListResponse: {
					type: "object",
					properties: {
						items: {
							type: "array",
							items: { $ref: "#/components/schemas/Match" }
						},
						paging: {
							type: "object",
							properties: {
								limit: { type: "integer", example: 100 },
								offset: { type: "integer", example: 0 },
								total: { type: "integer", example: 2500 }
							},
							required: ["limit", "offset", "total"]
						},
						filters: {
							type: "object",
							properties: {
								from: { type: "string", format: "date-time", nullable: true },
								to: { type: "string", format: "date-time", nullable: true },
								playerId: { type: "integer", nullable: true, example: 12 },
								playerName: { type: "string", nullable: true, example: "alice" }
							},
							required: ["from", "to", "playerId", "playerName"]
						}
					},
					required: ["items", "paging", "filters"]
				},
				LivePlayerRef: {
					type: "object",
					properties: {
						id: { type: "integer", nullable: true, example: 42 },
						name: { type: "string", example: "alice" }
					},
					required: ["id", "name"]
				},
				LiveMatch: {
					type: "object",
					properties: {
						id: { type: "integer", example: 123456 },
						gameId: { type: "string", example: "match_live_1" },
						time: { type: "string", example: "1741737600000" },
						result: {
							type: "string",
							enum: ["A", "B", "DRAW", "INVALID"],
							example: "A"
						},
						playerA: { $ref: "#/components/schemas/LivePlayerRef" },
						playerB: { $ref: "#/components/schemas/LivePlayerRef" },
						playerAMove: { type: "string", example: "rock" },
						playerBMove: { type: "string", example: "scissors" },
						playerAMoveValid: { type: "boolean", example: true },
						playerBMoveValid: { type: "boolean", example: true },
						isValid: { type: "boolean", example: true },
						invalidReason: { type: "string", nullable: true, example: null },
						receivedAt: {
							type: "string",
							format: "date-time",
							example: "2026-03-14T18:10:00.000Z"
						}
					},
					required: [
						"id",
						"gameId",
						"time",
						"result",
						"playerA",
						"playerB",
						"playerAMove",
						"playerBMove",
						"playerAMoveValid",
						"playerBMoveValid",
						"isValid",
						"invalidReason",
						"receivedAt"
					]
				},
				LiveStreamSyncState: {
					type: "object",
					properties: {
						isRunning: { type: "boolean", example: false },
						lastStartedAt: { type: "string", format: "date-time", nullable: true },
						lastCompletedAt: { type: "string", format: "date-time", nullable: true },
						lastEventAt: { type: "string", format: "date-time", nullable: true },
						lastError: { type: "string", nullable: true, example: null },
						triggerSource: { type: "string", nullable: true, example: "manual" },
						sessionMs: { type: "integer", nullable: true, example: 15000 },
						maxMatches: { type: "integer", nullable: true, example: 25 }
					},
					required: [
						"isRunning",
						"lastStartedAt",
						"lastCompletedAt",
						"lastEventAt",
						"lastError",
						"triggerSource",
						"sessionMs",
						"maxMatches"
					]
				},
				LiveStreamResponse: {
					type: "object",
					properties: {
						items: {
							type: "array",
							items: { $ref: "#/components/schemas/LiveMatch" }
						},
						paging: {
							type: "object",
							properties: {
								limit: { type: "integer", example: 25 },
								offset: { type: "integer", example: 0 },
								total: { type: "integer", example: 42 }
							},
							required: ["limit", "offset", "total"]
						},
						cache: {
							type: "object",
							properties: {
								total: { type: "integer", example: 42 },
								maxItems: { type: "integer", example: 200 }
							},
							required: ["total", "maxItems"]
						},
						sync: { $ref: "#/components/schemas/LiveStreamSyncState" }
					},
					required: ["items", "paging", "cache", "sync"]
				},
				UserStats: {
					type: "object",
					properties: {
						id: { type: "integer", example: 12 },
						name: { type: "string", example: "alice" },
						matches: { type: "integer", example: 120 },
						wins: { type: "integer", example: 65 },
						losses: { type: "integer", example: 40 },
						draws: { type: "integer", example: 15 },
						invalidMatches: { type: "integer", example: 2 },
						winRate: {
							type: "number",
							format: "float",
							nullable: true,
							example: 0.5417
						}
					},
					required: [
						"id",
						"name",
						"matches",
						"wins",
						"losses",
						"draws",
						"invalidMatches",
						"winRate"
					]
				},
				UserListResponse: {
					type: "object",
					properties: {
						items: {
							type: "array",
							items: { $ref: "#/components/schemas/UserStats" }
						},
						paging: {
							type: "object",
							properties: {
								limit: { type: "integer", example: 50 },
								offset: { type: "integer", example: 0 },
								total: { type: "integer", example: 400 }
							},
							required: ["limit", "offset", "total"]
						},
						filters: {
							type: "object",
							properties: {
								query: { type: "string", nullable: true, example: "ali" },
								from: { type: "string", format: "date-time", nullable: true },
								to: { type: "string", format: "date-time", nullable: true },
								sortBy: {
									type: "string",
									enum: ["name", "wins", "matches", "losses", "draws"],
									example: "wins"
								},
								sortOrder: {
									type: "string",
									enum: ["asc", "desc"],
									example: "desc"
								}
							},
							required: ["query", "from", "to", "sortBy", "sortOrder"]
						}
					},
					required: ["items", "paging", "filters"]
				},
				LeaderboardItem: {
					allOf: [
						{ $ref: "#/components/schemas/UserStats" },
						{
							type: "object",
							properties: {
								rank: { type: "integer", example: 1 }
							},
							required: ["rank"]
						}
					]
				},
				LeaderboardResponse: {
					type: "object",
					properties: {
						items: {
							type: "array",
							items: { $ref: "#/components/schemas/LeaderboardItem" }
						},
						filters: {
							type: "object",
							properties: {
								from: { type: "string", format: "date-time" },
								to: { type: "string", format: "date-time" }
							},
							required: ["from", "to"]
						},
						paging: {
							type: "object",
							properties: {
								limit: { type: "integer", example: 50 },
								offset: { type: "integer", example: 0 }
							},
							required: ["limit", "offset"]
						}
					},
					required: ["items", "filters", "paging"]
				},
				UserProfileResponse: {
					type: "object",
					properties: {
						user: { $ref: "#/components/schemas/UserStats" },
						matches: { $ref: "#/components/schemas/MatchListResponse" }
					},
					required: ["user", "matches"]
				},
				SyncState: {
					type: "object",
					properties: {
						status: { type: "string", example: "idle" }
					},
					additionalProperties: true
				},
				SyncResponse: {
					type: "object",
					properties: {
						status: {
							type: "string",
							enum: ["started", "already_running", "ok"],
							example: "started"
						},
						sync: { $ref: "#/components/schemas/SyncState" }
					},
					required: ["status", "sync"]
				},
				LiveSyncStartResponse: {
					allOf: [
						{ $ref: "#/components/schemas/LiveStreamResponse" },
						{
							type: "object",
							properties: {
								status: {
									type: "string",
									enum: ["started", "already_running"],
									example: "started"
								}
							},
							required: ["status"]
						}
					]
				},
				HealthResponse: {
					type: "object",
					properties: {
						status: { type: "string", example: "ok" }
					},
					required: ["status"]
				}
			}
		}
	},
	apis: [path.join(__dirname, "modules/**/*.routes.{ts,js}")]
})
