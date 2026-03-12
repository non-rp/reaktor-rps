import { Router } from "express"
import {
	getHistorySyncStatus,
	listHistory,
	triggerHistorySync
} from "./history.controller"

const router = Router()

/**
 * @openapi
 * /api/history:
 *   get:
 *     tags:
 *       - History
 *     summary: List match history
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 500
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *       - in: query
 *         name: playerId
 *         schema:
 *           type: integer
 *           minimum: 0
 *       - in: query
 *         name: playerName
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Exact UTC day in YYYY-MM-DD format.
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
 *         description: Paginated match history
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MatchListResponse'
 */
router.get("/", listHistory)

/**
 * @openapi
 * /api/history/sync:
 *   get:
 *     tags:
 *       - History
 *     summary: Trigger background history sync
 *     responses:
 *       200:
 *         description: Sync is already running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SyncResponse'
 *       202:
 *         description: Sync job started
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SyncResponse'
 */
router.get("/sync", triggerHistorySync)

/**
 * @openapi
 * /api/history/sync/status:
 *   get:
 *     tags:
 *       - History
 *     summary: Get current history sync status
 *     responses:
 *       200:
 *         description: Current sync state
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SyncResponse'
 */
router.get("/sync/status", getHistorySyncStatus)

export default router
