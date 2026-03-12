import { Router } from "express"
import {
	getLeaderboardHandler,
	getUserHandler,
	listUsersHandler
} from "./users.controller"

const router = Router()

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: List users with aggregated stats
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 200
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Case-insensitive substring match by player name.
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Inclusive date filter in YYYY-MM-DD format.
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Inclusive date filter in YYYY-MM-DD format.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, wins, matches, losses, draws]
 *           default: wins
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated user list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
 */
router.get("/", listUsersHandler)

/**
 * @openapi
 * /api/users/leaderboard:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get leaderboard for a date range
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 200
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Inclusive date filter in YYYY-MM-DD format.
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Inclusive date filter in YYYY-MM-DD format.
 *     responses:
 *       200:
 *         description: Ranked leaderboard
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaderboardResponse'
 */
router.get("/leaderboard", getLeaderboardHandler)

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get a user profile with match history
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 200
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: User profile and paginated matches
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfileResponse'
 *       400:
 *         description: Invalid user id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get("/:id", getUserHandler)

export default router
