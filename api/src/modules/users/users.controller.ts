import type { NextFunction, Request, Response } from "express"
import {
	buildDefaultLeaderboardRange,
	getLeaderboard,
	getUserProfile,
	listUsers
} from "./users.service"

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

export async function listUsersHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const params = parseListParams(req)
		const result = await listUsers(params)

		res.json(result)
	} catch (error) {
		next(error)
	}
}

export async function getUserHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const rawUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
		const userId = Number.parseInt(rawUserId, 10)

		if (!Number.isFinite(userId) || userId <= 0) {
			res.status(400).json({ message: "Invalid user id" })
			return
		}

		const params = parseRangeAndPaging(req)
		const result = await getUserProfile(userId, params)

		if (!result) {
			res.status(404).json({ message: "User not found" })
			return
		}

		res.json(result)
	} catch (error) {
		next(error)
	}
}

export async function getLeaderboardHandler(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		const params = parseRangeAndPaging(req)
		const defaultRange = buildDefaultLeaderboardRange()

		const result = await getLeaderboard({
			...params,
			from: params.from ?? defaultRange.from,
			to: params.to ?? defaultRange.to
		})

		res.json(result)
	} catch (error) {
		next(error)
	}
}

function parseListParams(req: Request) {
	const range = parseRangeAndPaging(req)

	return {
		...range,
		query: parseOptionalString(req.query.query),
		sortBy: parseSortBy(req.query.sortBy),
		sortOrder: parseSortOrder(req.query.sortOrder)
	}
}

function parseRangeAndPaging(req: Request) {
	const limit = parsePositiveInt(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT)
	const offset = parsePositiveInt(req.query.offset, 0)
	const { from, to } = parseDateFilters(req.query.from, req.query.to)

	return {
		limit,
		offset,
		from,
		to
	}
}

function parsePositiveInt(value: unknown, fallback: number, max?: number): number {
	if (typeof value !== "string" || value.trim() === "") {
		return fallback
	}

	const parsed = Number.parseInt(value, 10)

	if (!Number.isFinite(parsed) || parsed < 0) {
		return fallback
	}

	return typeof max === "number" ? Math.min(parsed, max) : parsed
}

function parseOptionalString(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined
	}

	const normalized = value.trim()

	return normalized === "" ? undefined : normalized
}

function parseDateFilters(fromValue: unknown, toValue: unknown): { from?: Date, to?: Date } {
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

function parseSortBy(value: unknown): "name" | "wins" | "matches" | "losses" | "draws" {
	switch (value) {
		case "wins":
		case "matches":
		case "losses":
		case "draws":
		case "name":
			return value
		default:
			return "wins"
	}
}

function parseSortOrder(value: unknown): "asc" | "desc" {
	return value === "asc" ? "asc" : "desc"
}
