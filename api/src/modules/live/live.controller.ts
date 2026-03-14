import type { NextFunction, Request, Response } from "express"
import { getLiveStreamSnapshot, startLiveStreamSync } from "./live.service"

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 200

export async function getLiveStream(req: Request, res: Response, next: NextFunction) {
	try {
		const limit = parsePositiveInt(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT)
		const offset = parsePositiveInt(req.query.offset, 0)
		const response = await getLiveStreamSnapshot({ limit, offset })

		res.json(response)
	} catch (error) {
		next(error)
	}
}

export async function syncLiveStreamNow(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		const limit = parsePositiveInt(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT)
		const offset = parsePositiveInt(req.query.offset, 0)
		const sessionMs = parseOptionalPositiveInt(req.body?.sessionMs)
		const maxMatches = parseOptionalPositiveInt(req.body?.maxMatches)
		const result = await startLiveStreamSync("manual", { sessionMs, maxMatches })
		const response = await getLiveStreamSnapshot({ limit, offset })

		res.status(result.started ? 201 : 200).json({
			status: result.started ? "started" : "already_running",
			...response
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
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
		return undefined
	}

	return Math.trunc(value)
}
