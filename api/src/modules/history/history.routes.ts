import { Router } from "express"
import {
	getHistorySyncStatus,
	listHistory,
	triggerHistorySync
} from "./history.controller"

const router = Router()

router.get("/", listHistory)
router.get("/sync", triggerHistorySync)
router.get("/sync/status", getHistorySyncStatus)

export default router
