import { Router } from "express"
import rateLimit from "express-rate-limit"
import { getLiveStream, syncLiveStreamNow } from "./live.controller"

const router = Router()
const liveSyncRateLimit = rateLimit({
	windowMs: 1000,
	limit: 1
})

/**
 * @openapi
 * /api/live/stream:
 *   get:
 *     tags:
 *       - Live
 *     summary: Get latest cached live matches
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 200
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: Cached live matches and sync status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LiveStreamResponse'
 *   post:
 *     tags:
 *       - Live
 *     summary: Run a short live stream sync and update cache
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionMs:
 *                 type: integer
 *                 minimum: 1000
 *                 maximum: 30000
 *                 default: 15000
 *               maxMatches:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 25
 *     responses:
 *       200:
 *         description: Sync is already running and the current cache snapshot was returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/LiveStreamResponse'
 *                 - type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: already_running
 *       201:
 *         description: Sync started and the current cache snapshot was returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/LiveStreamResponse'
 *                 - type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: started
 */
router.get("/stream", getLiveStream)
router.post("/stream", liveSyncRateLimit, syncLiveStreamNow)

export default router
