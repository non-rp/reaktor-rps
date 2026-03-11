import { Router } from "express"
import { getMatches } from "../services/historyService"
import { syncHistory } from "../services/historySyncService"

const router = Router()

router.get("/", async (req, res) => {

	const matches = await getMatches()

	res.json(matches)

})

router.get("/sync", async (req, res, next) => {
	try {
		const summary = await syncHistory()

		res.status(200).json({
			status: "ok",
			summary
		})
	} catch (error) {
		next(error)
	}
})

export default router
