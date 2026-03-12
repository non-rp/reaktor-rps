import { Router } from "express"
import {
	getLeaderboardHandler,
	getUserHandler,
	listUsersHandler
} from "./users.controller"

const router = Router()

router.get("/", listUsersHandler)
router.get("/leaderboard", getLeaderboardHandler)
router.get("/:id", getUserHandler)

export default router
