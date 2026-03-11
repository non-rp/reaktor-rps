import cron from "node-cron"
import { syncHistory } from "../services/historySyncService"

export function startHistorySyncJob() {

	cron.schedule("0 * * * *", async () => {

		console.log("Running history sync")

		await syncHistory()

	})
}