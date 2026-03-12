import type { NextFunction, Request, Response } from "express"
import { getMatches } from "./history.service"
import { getHistorySyncState, startHistorySync } from "./sync/historySync.service"

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500

export async function listHistory(req: Request, res: Response, next: NextFunction) {
	try {
		const limit = parsePositiveInt(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT)
		const offset = parsePositiveInt(req.query.offset, 0)

		const matches = await getMatches({
			limit,
			offset
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
