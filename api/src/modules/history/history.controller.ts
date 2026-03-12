import type { NextFunction, Request, Response } from "express"
import { getMatches } from "./history.service"
import { getHistorySyncState, startHistorySync } from "./sync/historySync.service"

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500

export async function listHistory(req: Request, res: Response, next: NextFunction) {
	try {
		const limit = parsePositiveInt(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT)
		const offset = parsePositiveInt(req.query.offset, 0)
		const playerId = parseOptionalPositiveInt(req.query.playerId)
		const playerName = parseOptionalString(req.query.playerName)
		const { from, to } = parseHistoryDateFilters(req.query.date, req.query.from, req.query.to)

		const matches = await getMatches({
			limit,
			offset,
			from,
			to,
			playerId,
			playerName
		})

		res.json(matches)
	} catch (error) {
		next(error)
	}
}

export async function triggerHistorySync(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		const result = await startHistorySync("manual")

		res.status(result.started ? 202 : 200).json({
			status: result.started ? "started" : "already_running",
			sync: result.state
		})
	} catch (error) {
		next(error)
	}
}

export async function getHistorySyncStatus(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		const state = await getHistorySyncState()

		res.json({
			status: "ok",
			sync: state
		})
	} catch (error) {
		next(error)
	}
}

function parsePositiveInt(
	value: unknown,
	fallback: number,
	max?: number
): number {
	if (typeof value !== "string" || value.trim() === "") {
		return fallback
	}

	const parsed = Number.parseInt(value, 10)

	if (!Number.isFinite(parsed) || parsed < 0) {
		return fallback
	}

	if (typeof max === "number") {
		return Math.min(parsed, max)
	}

	return parsed
}

function parseOptionalPositiveInt(value: unknown): number | undefined {
	if (typeof value !== "string" || value.trim() === "") {
		return undefined
	}

	const parsed = Number.parseInt(value, 10)

	if (!Number.isFinite(parsed) || parsed < 0) {
		return undefined
	}

	return parsed
}

function parseOptionalString(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined
	}

	const normalized = value.trim()

	return normalized === "" ? undefined : normalized
}

function parseHistoryDateFilters(
	dateValue: unknown,
	fromValue: unknown,
	toValue: unknown
): {
	from?: Date
	to?: Date
} {
	const date = parseDateOnly(dateValue)

	if (date) {
		return {
			from: date,
			to: new Date(date.getTime() + 24 * 60 * 60 * 1000)
		}
	}

	const from = parseDateOnly(fromValue)
	const inclusiveTo = parseDateOnly(toValue)

	return {
		from: from ?? undefined,
		to: inclusiveTo ? new Date(inclusiveTo.getTime() + 24 * 60 * 60 * 1000) : undefined
	}
}

function parseDateOnly(value: unknown): Date | undefined {
	if (typeof value !== "string" || value.trim() === "") {
		return undefined
	}

	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return undefined
	}

	const parsed = new Date(`${value}T00:00:00.000Z`)

	return Number.isNaN(parsed.getTime()) ? undefined : parsed
}
