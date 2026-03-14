import { prisma } from "../../db/prisma"
import type { RawGameResult } from "../../types/raw"
import type { ValidMove } from "../../types/match"
import { getWinner, validateMove } from "../../utils/winner"
import type { LiveMatch, LiveStreamResponse, LiveStreamSyncState } from "./live.types"

const DEFAULT_SESSION_MS = 60000
const MAX_SESSION_MS = 60000
const DEFAULT_MAX_MATCHES = 25
const MAX_MATCHES_PER_SYNC = 100
const MAX_CACHE_ITEMS = 200
const LIVE_CONNECT_TIMEOUT_MS = 5000

type LiveSyncOptions = {
	sessionMs?: number
	maxMatches?: number
}

type LiveCacheState = {
	matches: LiveMatch[]
	byGameId: Map<string, LiveMatch>
	sync: LiveStreamSyncState
}

const cache: LiveCacheState = {
	matches: [],
	byGameId: new Map(),
	sync: {
		isRunning: false,
		lastStartedAt: null,
		lastCompletedAt: null,
		lastEventAt: null,
		lastError: null,
		triggerSource: null,
		sessionMs: null,
		maxMatches: null
	}
}

const playerIdCache = new Map<string, number | null>()

let activeSyncPromise: Promise<void> | null = null

export async function getLiveStreamSnapshot(params: {
	limit: number
	offset: number
}): Promise<LiveStreamResponse> {
	return buildResponse(params.limit, params.offset)
}

export async function startLiveStreamSync(
	triggerSource: string,
	options: LiveSyncOptions
): Promise<{
	started: boolean
}> {
	if (!activeSyncPromise) {
		activeSyncPromise = runLiveSync(triggerSource, options).finally(() => {
			activeSyncPromise = null
		})

		return {
			started: true
		}
	}

	return {
		started: false
	}
}

async function runLiveSync(triggerSource: string, options: LiveSyncOptions): Promise<void> {
	const sessionMs = clampInteger(options.sessionMs, DEFAULT_SESSION_MS, 1000, MAX_SESSION_MS)
	const maxMatches = clampInteger(options.maxMatches, DEFAULT_MAX_MATCHES, 1, MAX_MATCHES_PER_SYNC)
	const now = new Date().toISOString()

	cache.sync = {
		...cache.sync,
		isRunning: true,
		lastStartedAt: now,
		lastError: null,
		triggerSource,
		sessionMs,
		maxMatches
	}

	try {
		await collectLiveMatches(sessionMs, maxMatches)

		cache.sync = {
			...cache.sync,
			isRunning: false,
			lastCompletedAt: new Date().toISOString()
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown live sync error"
		cache.sync = {
			...cache.sync,
			isRunning: false,
			lastError: message,
			lastCompletedAt: new Date().toISOString()
		}
		throw error
	}
}

async function collectLiveMatches(sessionMs: number, maxMatches: number): Promise<void> {
	const liveUrl = buildLiveUrl()
	const apiToken = process.env.RPS_API_TOKEN

	if (!apiToken) {
		throw new Error("RPS_API_TOKEN must be set in environment variables")
	}

	const controller = new AbortController()
	const sessionTimeout = setTimeout(() => controller.abort("session_timeout"), sessionMs)
	const connectTimeout = setTimeout(() => controller.abort("connect_timeout"), LIVE_CONNECT_TIMEOUT_MS)

	try {
		const response = await fetch(liveUrl, {
			signal: controller.signal,
			headers: {
				Accept: "text/event-stream",
				Authorization: `Bearer ${apiToken}`
			}
		})

		clearTimeout(connectTimeout)

		if (!response.ok) {
			throw new Error(`Failed to connect to live stream: ${response.status} ${response.statusText}`)
		}

		if (!response.body) {
			throw new Error("Live stream response does not include a body")
		}

		const reader = response.body.getReader()
		const decoder = new TextDecoder()
		let buffer = ""
		let receivedMatches = 0

		while (receivedMatches < maxMatches) {
			try {
				const { done, value } = await reader.read()

				if (done) {
					break
				}

				buffer += decoder.decode(value, { stream: true })
				const chunks = buffer.split("\n\n")
				buffer = chunks.pop() ?? ""

				for (const chunk of chunks) {
					const match = parseSseChunk(chunk)

					if (!match) {
						continue
					}

					await upsertLiveMatch(match)
					receivedMatches += 1
					cache.sync = {
						...cache.sync,
						lastEventAt: new Date().toISOString()
					}

					if (receivedMatches >= maxMatches) {
						controller.abort("max_matches_reached")
						break
					}
				}
			} catch (error) {
				if (controller.signal.aborted) {
					break
				}

				throw error
			}
		}

		return
	} catch (error) {
		if (controller.signal.aborted) {
			if (controller.signal.reason === "connect_timeout") {
				throw new Error("Timed out while connecting to live stream")
			}

			return
		}

		throw error
	} finally {
		clearTimeout(connectTimeout)
		clearTimeout(sessionTimeout)
	}
}

function parseSseChunk(chunk: string): RawGameResult | null {
	const normalizedChunk = chunk.replace(/\r/g, "")
	const dataLines = normalizedChunk
		.split("\n")
		.filter((line) => line.startsWith("data:"))
		.map((line) => line.slice(5).trim())

	if (dataLines.length === 0) {
		return null
	}

	const payload = dataLines.join("\n")

	try {
		const parsed = JSON.parse(payload) as RawGameResult

		if (parsed?.type !== "GAME_RESULT" || !parsed.gameId) {
			return null
		}

		return parsed
	} catch {
		return null
	}
}

async function loadPlayerIds(playerNames: string[]): Promise<Map<string, number | null>> {
	const uniquePlayerNames = [...new Set(playerNames)]

	if (uniquePlayerNames.length === 0) {
		return new Map()
	}

	const players = await prisma.player.findMany({
		where: {
			name: {
				in: uniquePlayerNames
			}
		},
		select: {
			id: true,
			name: true
		}
	})

	const playersMap = new Map<string, number | null>(players.map((player) => [player.name, player.id]))

	for (const playerName of uniquePlayerNames) {
		if (!playersMap.has(playerName)) {
			playersMap.set(playerName, null)
		}
	}

	return playersMap
}

async function upsertLiveMatch(match: RawGameResult) {
	const playerIds = await resolvePlayerIdsForMatch(match)
	const liveMatch = mapRawToLiveMatch(match, playerIds)
	cache.byGameId.set(liveMatch.gameId, liveMatch)

	cache.matches = [liveMatch, ...cache.matches.filter((item) => item.gameId !== liveMatch.gameId)]
		.sort((left, right) => Number(right.time) - Number(left.time))
		.slice(0, MAX_CACHE_ITEMS)

	cache.byGameId = new Map(cache.matches.map((item) => [item.gameId, item]))
}

async function resolvePlayerIdsForMatch(match: RawGameResult): Promise<Map<string, number | null>> {
	const playerNames = [match.playerA.name, match.playerB.name]
	const missingPlayerNames = playerNames.filter((playerName) => !playerIdCache.has(playerName))

	if (missingPlayerNames.length > 0) {
		const resolvedPlayerIds = await loadPlayerIds(missingPlayerNames)

		for (const [playerName, playerId] of resolvedPlayerIds) {
			playerIdCache.set(playerName, playerId)
		}
	}

	return new Map(playerNames.map((playerName) => [playerName, playerIdCache.get(playerName) ?? null]))
}

function mapRawToLiveMatch(match: RawGameResult, playerIds: Map<string, number | null>): LiveMatch {
	const playerAMove = validateMove(match.playerA.played)
	const playerBMove = validateMove(match.playerB.played)
	const isValid = playerAMove.isValid && playerBMove.isValid
	const result = isValid
		? getWinner(
			playerAMove.normalized as ValidMove,
			playerBMove.normalized as ValidMove
		)
		: "INVALID"

	return {
		id: createSyntheticId(match.gameId),
		gameId: match.gameId,
		time: normalizeMatchTime(match.time).toString(),
		result,
		playerA: {
			id: playerIds.get(match.playerA.name) ?? null,
			name: match.playerA.name
		},
		playerB: {
			id: playerIds.get(match.playerB.name) ?? null,
			name: match.playerB.name
		},
		playerAMove: match.playerA.played,
		playerBMove: match.playerB.played,
		playerAMoveValid: playerAMove.isValid,
		playerBMoveValid: playerBMove.isValid,
		isValid,
		invalidReason: buildInvalidReason(playerAMove, playerBMove),
		receivedAt: new Date().toISOString()
	}
}

async function buildResponse(limit: number, offset: number): Promise<LiveStreamResponse> {
	return {
		items: cache.matches.slice(offset, offset + limit),
		paging: {
			limit,
			offset,
			total: cache.matches.length
		},
		cache: {
			total: cache.matches.length,
			maxItems: MAX_CACHE_ITEMS
		},
		sync: cache.sync
	}
}

function buildLiveUrl(): string {
	const baseUrl = process.env.RPS_BASE_URL

	if (!baseUrl) {
		throw new Error("RPS_BASE_URL must be set in environment variables")
	}

	const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
	return new URL("live", normalizedBaseUrl).toString()
}

function clampInteger(
	value: number | undefined,
	fallback: number,
	min: number,
	max: number
): number {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return fallback
	}

	return Math.min(Math.max(Math.trunc(value), min), max)
}

function normalizeMatchTime(value: number | string): bigint {
	if (typeof value === "number") {
		return BigInt(value)
	}

	const parsedDate = Date.parse(value)

	if (!Number.isNaN(parsedDate)) {
		return BigInt(parsedDate)
	}

	if (/^\d+$/.test(value)) {
		return BigInt(value)
	}

	throw new Error(`Unsupported match time value: ${value}`)
}

function buildInvalidReason(
	playerAMove: ReturnType<typeof validateMove>,
	playerBMove: ReturnType<typeof validateMove>
): string | null {
	const reasons: string[] = []

	if (!playerAMove.isValid) {
		reasons.push(`playerA move "${playerAMove.raw}" is invalid`)
	}

	if (!playerBMove.isValid) {
		reasons.push(`playerB move "${playerBMove.raw}" is invalid`)
	}

	return reasons.length > 0 ? reasons.join("; ") : null
}

function createSyntheticId(gameId: string): number {
	let hash = 0

	for (let index = 0; index < gameId.length; index += 1) {
		hash = (hash * 31 + gameId.charCodeAt(index)) | 0
	}

	return Math.abs(hash) || 1
}
